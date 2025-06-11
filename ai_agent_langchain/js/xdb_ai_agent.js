/**
 * XDB AI Connector Library
 * A modular library for integrating XDB memory management with LangChain agents
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { z } = require('zod');

// LangChain imports
const { ChatOpenAI } = require('@langchain/openai');
const { AgentExecutor, createOpenAIFunctionsAgent } = require('langchain/agents');
const { DynamicStructuredTool } = require('@langchain/core/tools');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { BufferMemory } = require('langchain/memory');
const { ConsoleCallbackHandler } = require('@langchain/core/callbacks/console');

// ===== Configuration Management =====

class XDBConfig {
    constructor({ baseUrl, apiKey, privateKeyPath = null, privateKeyContent = null }) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.privateKeyPath = privateKeyPath;
        this.privateKeyContent = privateKeyContent;
    }

    static fromEnv() {
        return new XDBConfig({
            baseUrl: process.env.XDB_BASE_URL || 'http://localhost:5000',
            apiKey: process.env.XDB_API_KEY || '',
            privateKeyPath: process.env.XDB_PRIVATE_KEY_PATH,
            privateKeyContent: process.env.XDB_PRIVATE_KEY_CONTENT
        });
    }

    static fromFile(configPath) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return new XDBConfig(configData);
    }

    validate() {
        if (!this.apiKey) {
            throw new Error('API key is required');
        }
        if (!this.privateKeyPath && !this.privateKeyContent) {
            throw new Error('Either privateKeyPath or privateKeyContent must be provided');
        }
        return true;
    }
}

// ===== Data Models =====

const MemoryRecordSchema = z.object({
    memory: z.string(),
    date: z.string(),
    transaction_number: z.string(),
    tokens: z.array(z.string()).default([]),
    language: z.string().optional(),
    tag: z.string().optional(),
    session_id: z.string().optional()
});

const XDBResponseSchema = z.object({
    status: z.string(),
    message: z.string(),
    data: z.any().optional(),
    error: z.boolean().default(false),
    process_id: z.string().optional()
});

const ListMemoriesInputSchema = z.object({
    user_key: z.string().describe('The user key to list memories for'),
    tokens: z.array(z.string()).optional().describe('Optional list of tokens to filter memories'),
    query: z.string().default('').describe('Optional query string to search memories')
});

const CreateMemoryInputSchema = z.object({
    user_key: z.string().describe('The user key to create memory for'),
    content: z.string().describe('The content/text of the memory to store'),
    tag: z.string().default('').describe('Optional tag for categorizing the memory'),
    session_id: z.string().default('').describe('Optional session ID for grouping memories')
});

// ===== Core API Client =====

class XDBAPIClient {
    constructor(config) {
        this.config = config;
        this.config.validate();
        this.privateKey = this._loadPrivateKey();
        
        // Create axios instance with default headers
        this.httpClient = axios.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.config.apiKey
            }
        });
    }

    _loadPrivateKey() {
        try {
            if (this.config.privateKeyPath && fs.existsSync(this.config.privateKeyPath)) {
                return fs.readFileSync(this.config.privateKeyPath, 'utf8');
            } else if (this.config.privateKeyContent) {
                return this.config.privateKeyContent;
            } else {
                console.warn('Warning: No private key provided. Requests will not be signed.');
                return null;
            }
        } catch (error) {
            console.warn(`Warning: Could not load private key: ${error.message}`);
            return null;
        }
    }

    _createSignature(payload) {
        if (!this.privateKey) {
            return '';
        }

        try {
            const sign = crypto.createSign('SHA256');
            sign.update(payload);
            sign.end();
            return sign.sign(this.privateKey, 'base64');
        } catch (error) {
            console.error(`Error creating signature: ${error.message}`);
            return '';
        }
    }

    async _makeRequest(endpoint, data) {
        const payload = JSON.stringify(data);
        const headers = { ...this.httpClient.defaults.headers };

        // Add signature if we have a private key
        if (this.privateKey) {
            const signature = this._createSignature(payload);
            if (signature) {
                headers.signature = signature;
            }
        }

        try {
            const response = await this.httpClient.post(endpoint, data, { headers });
            return XDBResponseSchema.parse(response.data);
        } catch (error) {
            return {
                status: 'Failed',
                message: `Request failed: ${error.message}`,
                error: true
            };
        }
    }

    async listMemories(userKey, tokens = null, query = '') {
        const data = {
            userKey,
            tokens: tokens || [],
            query
        };
        return this._makeRequest('/api/memory/list', data);
    }

    async createMemory(userKey, content, tag = '', sessionId = '') {
        const data = {
            userKey,
            content,
            tag,
            sessionId: sessionId || new Date().toISOString().slice(0, 13).replace(/[-:T]/g, '')
        };
        return this._makeRequest('/api/memory/create', data);
    }

    async healthCheck() {
        return this._makeRequest('/api/health', {});
    }
}

// ===== Tool Factory =====

class XDBToolFactory {
    constructor(xdbClient) {
        this.xdbClient = xdbClient;
    }

    createListMemoriesTool() {
        return new DynamicStructuredTool({
            name: 'list_memories',
            description: 'List all memories for a user. You can optionally filter by tokens or search with a query string.',
            schema: ListMemoriesInputSchema,
            func: async ({ user_key, tokens, query }) => {
                try {
                    const result = await this.xdbClient.listMemories(user_key, tokens, query);
                    
                    if (result.status === 'Success') {
                        const memories = result.data?.memories || [];
                        if (memories.length === 0) {
                            return 'No memories found for this user.';
                        }
                        
                        const formattedMemories = memories.map((memory, index) => {
                            return `Memory ${index + 1}:
- Content: ${memory.memory || 'N/A'}
- Date: ${memory.date || 'N/A'}
- Transaction: ${memory.transactionNumber || 'N/A'}
- Tokens: ${(memory.tokens || []).join(', ')}
- Language: ${memory.language || 'Not specified'}`;
                        });
                        
                        return `Found ${memories.length} memories:\n\n${formattedMemories.join('\n\n')}`;
                    } else {
                        return `Error: ${result.message}`;
                    }
                } catch (error) {
                    return `Error listing memories: ${error.message}`;
                }
            }
        });
    }

    createCreateMemoryTool() {
        return new DynamicStructuredTool({
            name: 'create_memory',
            description: 'Create a new memory for a user. Requires user key and content. Optional tag and session ID can be provided.',
            schema: CreateMemoryInputSchema,
            func: async ({ user_key, content, tag, session_id }) => {
                try {
                    const result = await this.xdbClient.createMemory(user_key, content, tag, session_id);
                    
                    if (result.status === 'Success') {
                        return `Memory created successfully!\nMessage: ${result.message}\nProcess ID: ${result.process_id || 'N/A'}`;
                    } else {
                        return `Failed to create memory: ${result.message}`;
                    }
                } catch (error) {
                    return `Error creating memory: ${error.message}`;
                }
            }
        });
    }

    createAllTools() {
        return [
            this.createListMemoriesTool(),
            this.createCreateMemoryTool()
        ];
    }
}

// ===== Main Agent Class =====

class XDBAIAgent {
    constructor({
        config,
        openaiApiKey = null,
        model = 'gpt-3.5-turbo',
        temperature = 0.1,
        streaming = true,
        verbose = true
    }) {
        this.config = config;
        this.xdbClient = new XDBAPIClient(config);
        this.verbose = verbose;

        // Initialize LLM
        const callbacks = streaming ? [new ConsoleCallbackHandler()] : [];
        this.llm = new ChatOpenAI({
            modelName: model,
            temperature,
            openAIApiKey: openaiApiKey || process.env.OPENAI_API_KEY,
            streaming,
            callbacks
        });

        // Create tools
        const toolFactory = new XDBToolFactory(this.xdbClient);
        this.tools = toolFactory.createAllTools();

        // Setup memory
        this.memory = new BufferMemory({
            memoryKey: 'chat_history',
            returnMessages: true
        });

        // Create agent
        this.agent = null;
        this._createAgent();
    }

    async _createAgent() {
        const prompt = ChatPromptTemplate.fromMessages([
            ['system', `You are an intelligent memory management assistant powered by XDB AI Connector.            
                
                You can help users with:
                **Memory Management:**
                - List memories for any user (with optional filtering by tokens or search queries)
                - Understand user query and extract search query, the query can be just a verb or noun, unless user asks to list all his memories, always extract key verbs or nouns for search.
                - Create new memories with content, tags, and session grouping
                - Search through existing memories using natural language queries

                **Important Guidelines:**
                - Always ask for a user key when it's needed for operations
                - When creating memories, encourage users to provide meaningful content
                - Suggest appropriate tags and session IDs to help organize memories
                - Handle errors gracefully and provide helpful feedback
                - Be conversational and explain what you're doing

                **Best Practices:**
                - Format memory lists in a readable way
                - Provide suggestions for better memory organization
                - Use natural language to make interactions friendly

                Current time: {current_time}
                XDB Base URL: {base_url}`],
            new MessagesPlaceholder('chat_history'),
            ['user', '{input}'],
            new MessagesPlaceholder('agent_scratchpad')
        ]);

        const agent = await createOpenAIFunctionsAgent({
            llm: this.llm,
            tools: this.tools,
            prompt
        });

        this.agent = new AgentExecutor({
            agent,
            tools: this.tools,
            memory: this.memory,
            verbose: this.verbose,
            handleParsingErrors: true,
            maxIterations: 5
        });
    }

    async chat(message) {
        try {
            if (!this.agent) {
                await this._createAgent();
            }
            
            const response = await this.agent.invoke({
                input: message,
                current_time: new Date().toLocaleString(),
                base_url: this.config.baseUrl
            });
            
            return response.output;
        } catch (error) {
            return `Sorry, I encountered an error: ${error.message}`;
        }
    }

    async resetMemory() {
        await this.memory.clear();
    }

    async addCustomTool(tool) {
        this.tools.push(tool);
        // Recreate agent with updated tools
        await this._createAgent();
    }
}

// ===== Factory Functions =====

function createXDBAIAgentFromEnv({
    openaiApiKey = null,
    model = 'gpt-3.5-turbo',
    ...kwargs
} = {}) {
    const config = XDBConfig.fromEnv();
    return new XDBAIAgent({ config, openaiApiKey, model, ...kwargs });
}

function createXDBAIAgentFromConfig({
    configPath,
    openaiApiKey = null,
    model = 'gpt-3.5-turbo',
    ...kwargs
} = {}) {
    const config = XDBConfig.fromFile(configPath);
    return new XDBAIAgent({ config, openaiApiKey, model, ...kwargs });
}

function createXDBAIAgent({
    baseUrl,
    apiKey,
    privateKeyPath = null,
    privateKeyContent = null,
    openaiApiKey = null,
    model = 'gpt-3.5-turbo',
    ...kwargs
} = {}) {
    const config = new XDBConfig({
        baseUrl,
        apiKey,
        privateKeyPath,
        privateKeyContent
    });
    return new XDBAIAgent({ config, openaiApiKey, model, ...kwargs });
}

// ===== Utility Classes =====

class XDBAgentManager {
    constructor() {
        this.agents = new Map();
    }

    addAgent(name, agent) {
        this.agents.set(name, agent);
    }

    getAgent(name) {
        return this.agents.get(name);
    }

    removeAgent(name) {
        this.agents.delete(name);
    }

    listAgents() {
        return Array.from(this.agents.keys());
    }

    async chatWithAgent(agentName, message) {
        const agent = this.getAgent(agentName);
        if (agent) {
            return await agent.chat(message);
        }
        return `Agent '${agentName}' not found`;
    }
}

// ===== Example Usage =====

async function exampleUsage() {
    try {
        // Method 1: Create from environment variables
        let agent = createXDBAIAgentFromEnv();
        
        // Method 2: Create with explicit configuration
        agent = createXDBAIAgent({
            baseUrl: 'http://localhost:5000',
            apiKey: 'your-api-key',
            privateKeyPath: '/path/to/private/key.pem',
            openaiApiKey: 'your-openai-key'
        });
        
        // Method 3: Create from configuration file
        agent = createXDBAIAgentFromConfig({ configPath: 'config.json' });
        
        // Chat with the agent
        let response = await agent.chat("List my memories for user key 'user123'");
        console.log(response);
        
        // Create a memory
        response = await agent.chat("Create a memory about visiting Paris with tag 'travel' for user 'user123'");
        console.log(response);
        
        // Reset conversation memory
        await agent.resetMemory();
        
    } catch (error) {
        console.error('Error in example usage:', error);
    }
}

// ===== Exports =====

module.exports = {
    XDBConfig,
    XDBAPIClient,
    XDBToolFactory,
    XDBAIAgent,
    XDBAgentManager,
    createXDBAIAgentFromEnv,
    createXDBAIAgentFromConfig,
    createXDBAIAgent,
    exampleUsage,
    // Schemas for external use
    MemoryRecordSchema,
    XDBResponseSchema,
    ListMemoriesInputSchema,
    CreateMemoryInputSchema
};

// Run example if this file is executed directly
if (require.main === module) {
    exampleUsage();
}