// index.ts
// XDB AI Agent with intelligent user input handling

import * as crypto from 'crypto';
import * as fs from 'fs';
import axios, { AxiosInstance } from 'axios';
import express, { Express, Request, Response } from 'express';
import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// LangChain imports
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { BufferMemory } from "langchain/memory";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";

// Types and interfaces
interface XDBConfig {
  baseUrl: string;
  apiKey: string;
  privateKey: string;
}

interface Memory {
  memory: string;
  date: string;
  transactionNumber: string;
  tokens: string[];
  language?: string;
}

interface XDBResponse {
  status: string;
  message?: string;
  data?: {
    memories?: Memory[];
  };
  processId?: string;
  details?: any;
  error?: boolean;
}

interface UserSession {
  currentUser?: string;
  conversationHistory: string[];
}

// Configuration class
class XDBConfigLoader {
  static fromEnv(): XDBConfig {
    const requiredEnvVars = {
      XDB_BASE_URL: process.env.XDB_BASE_URL || "http://localhost:5000",
      XDB_API_KEY: process.env.XDB_API_KEY,
      XDB_PRIVATE_KEY: process.env.XDB_PRIVATE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
    };

    // Check for required environment variables
    if (!requiredEnvVars.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY is required in .env file");
      console.log("💡 Please add your OpenAI API key to the .env file:");
      console.log("   OPENAI_API_KEY=sk-your_actual_openai_key_here");
      process.exit(1);
    }

    return {
      baseUrl: requiredEnvVars.XDB_BASE_URL,
      apiKey: requiredEnvVars.XDB_API_KEY || "MRFXJ8nOmPHIQDDK9cpAIe20x2AOiJUiwGArgog7ppQ",
      privateKey: requiredEnvVars.XDB_PRIVATE_KEY || `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIJbIwATgm9pCMkAwFb0nsnkngz2rN/961CB8QvIxyR3QoAoGCCqGSM49
AwEHoUQDQgAEsGju9DsGgNJlVdVtP8Y9x4ZcEbV2rHAhgI/E30i8Xgsw20+Y1pLI
zWeaOlndtf2XOqVpSEUvsSuKMrrFVDdgOQ==
-----END EC PRIVATE KEY-----`
    };
  }
}

// XDB API Client
class XDBAPIClient {
  private config: XDBConfig;
  private axiosInstance: AxiosInstance;
  private privateKey?: crypto.KeyObject;

  constructor(config: XDBConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.loadPrivateKey();
  }

  private loadPrivateKey(): void {
    try {
      if (this.config.privateKey.startsWith('/')) {
        const keyData = fs.readFileSync(this.config.privateKey, 'utf8');
        this.privateKey = crypto.createPrivateKey(keyData);
      } else {
        this.privateKey = crypto.createPrivateKey(this.config.privateKey);
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Could not load private key: ${error}`);
      this.privateKey = undefined;
    }
  }

  private createSignature(payload: string): string {
    if (!this.privateKey) {
      return "";
    }

    try {
      const sign = crypto.createSign('SHA256');
      sign.update(payload, 'utf8');
      const signature = sign.sign(this.privateKey);
      return signature.toString('base64');
    } catch (error) {
      console.error(`Error creating signature: ${error}`);
      return "";
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<XDBResponse> {
    const payload = JSON.stringify(data);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': this.config.apiKey
    };

    if (this.privateKey) {
      const signature = this.createSignature(payload);
      if (signature) {
        headers['signature'] = signature;
      }
    }

    try {
      const response = await this.axiosInstance.post(endpoint, data, { headers });
      return response.data;
    } catch (error: any) {
      return {
        status: "Failed",
        message: `Request failed: ${error.message}`,
        error: true
      };
    }
  }

  async listMemories(userKey: string, tokens: string[] = [], query: string = ""): Promise<XDBResponse> {
    const data = { userKey, tokens, query };
    return this.makeRequest("/api/memory/list", data);
  }

  async createMemory(userKey: string, content: string, tag: string = "", sessionId: string = ""): Promise<XDBResponse> {
    const data = {
      userKey,
      content,
      tag,
      sessionId: sessionId || new Date().toISOString().slice(0, 10).replace(/-/g, '') + new Date().getHours().toString().padStart(2, '0')
    };
    return this.makeRequest("/api/memory/create", data);
  }
}

// User Input Extractor - helps extract user information from natural language
class UserInputExtractor {
  static extractUserKey(input: string, session: UserSession): string | null {
    // Check if user key is explicitly mentioned
    const userKeyPatterns = [
      /(?:user|key|id|identifier)(?:\s+is|\s*:|\s+)([a-zA-Z0-9_.-]+)/i,
      /(?:my|user|account)(?:\s+key|\s+id|\s+identifier)(?:\s+is|\s*:|\s+)([a-zA-Z0-9_.-]+)/i,
      /(?:i am|i'm|user|username|userid)(?:\s+is|\s*:|\s+)([a-zA-Z0-9_.-]+)/i,
      /for\s+(?:user|account)\s+([a-zA-Z0-9_.-]+)/i
    ];

    for (const pattern of userKeyPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return session.currentUser || null;
  }

  static extractMemoryContent(input: string): string | null {
    // Patterns to extract memory content
    const contentPatterns = [
      /(?:remember|save|store|create|add)(?:\s+(?:that|memory|this|about))?(?:\s*:|\s+)(.*)/i,
      /(?:memory|content)(?:\s+is|\s*:|\s+)(.*)/i,
      /(?:i want to|need to|would like to)\s+(?:remember|save|store)\s+(.*)/i
    ];

    for (const pattern of contentPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  static extractSearchQuery(input: string): string | null {
    // Patterns to extract search queries
    const searchPatterns = [
      /(?:search|find|look|show)(?:\s+(?:for|memories|about))?(?:\s*:|\s+)(.*)/i,
      /(?:memories|content)(?:\s+(?:about|containing|with))\s+(.*)/i,
      /(?:what|show)(?:\s+(?:memories|content))(?:\s+(?:about|containing|with))\s+(.*)/i
    ];

    for (const pattern of searchPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  static extractTag(input: string): string | null {
    const tagPatterns = [
      /(?:tag|category|label)(?:\s+is|\s*:|\s+)([a-zA-Z0-9_.-]+)/i,
      /(?:with|using)\s+tag\s+([a-zA-Z0-9_.-]+)/i,
      /tagged\s+(?:as\s+)?([a-zA-Z0-9_.-]+)/i
    ];

    for (const pattern of tagPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }
}

// Zod schemas with better validation
const ListMemoriesInputSchema = z.object({
  user_key: z.string().min(1, "User key is required").describe("The user key to list memories for"),
  tokens: z.array(z.string()).default([]).describe("Optional list of tokens to filter memories"),
  query: z.string().default("").describe("Optional query string to search memories")
});

const CreateMemoryInputSchema = z.object({
  user_key: z.string().min(1, "User key is required").describe("The user key to create memory for"),
  content: z.string().min(1, "Memory content is required").describe("The content/text of the memory to store"),
  tag: z.string().default("").describe("Optional tag for categorizing the memory"),
  session_id: z.string().default("").describe("Optional session ID for grouping memories")
});

// Main XDB AI Agent class
class XDBAIAgent {
  private config: XDBConfig;
  public xdbClient: XDBAPIClient;
  private llm: ChatOpenAI;
  private tools: DynamicStructuredTool[];
  private memory: BufferMemory;
  private agent?: AgentExecutor;
  private userSession: UserSession;

  constructor(config: XDBConfig, openaiApiKey?: string) {
    this.config = config;
    this.xdbClient = new XDBAPIClient(config);
    this.userSession = {
      conversationHistory: []
    };

    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.1,
      openAIApiKey: openaiApiKey || process.env.OPENAI_API_KEY,
      streaming: true,
      callbacks: [new ConsoleCallbackHandler()]
    });

    this.tools = this.createTools();
    this.memory = new BufferMemory({
      memoryKey: "chat_history",
      returnMessages: true
    });

    this.createAgent();
  }

  private createTools(): DynamicStructuredTool[] {
    const listMemoriesTool = new DynamicStructuredTool({
      name: "list_memories",
      description: "List all memories for a user. Requires a user key. You can optionally filter by tokens or search with a query string.",
      schema: ListMemoriesInputSchema,
      func: async (input: z.infer<typeof ListMemoriesInputSchema>) => {
        const { user_key, tokens = [], query = "" } = input;
        
        if (!user_key || user_key.trim() === '') {
          return "❌ Error: User key is required to list memories. Please provide your user key or identifier.";
        }
        
        try {
          console.log(`🔍 Listing memories for user: ${user_key}`);
          const result = await this.xdbClient.listMemories(user_key, tokens, query);

          if (result.status === "Success") {
            const memories = result.data?.memories || [];
            if (memories.length === 0) {
              return `📭 No memories found for user "${user_key}".${query ? ` (searched for: "${query}")` : ''}`;
            }

            const formattedMemories = memories.map((memory, index) => {
              return `📝 Memory ${index + 1}:
   Content: ${memory.memory || 'N/A'}
   Date: ${memory.date || 'N/A'}
   Transaction: ${memory.transactionNumber || 'N/A'}
   Tags: ${memory.tokens?.join(', ') || 'None'}
   Language: ${memory.language || 'Not specified'}`;
            });

            return `✅ Found ${memories.length} memories for user "${user_key}":\n\n${formattedMemories.join('\n\n')}\n`;
          } else {
            return `❌ Error listing memories: ${result.message || 'Unknown error occurred'}`;
          }
        } catch (error: any) {
          return `❌ Error listing memories: ${error.message}`;
        }
      }
    });

    const createMemoryTool = new DynamicStructuredTool({
      name: "create_memory",
      description: "Create a new memory for a user. Requires user key and content. Optional tag and session ID can be provided.",
      schema: CreateMemoryInputSchema,
      func: async (input: z.infer<typeof CreateMemoryInputSchema>) => {
        const { user_key, content, tag = "", session_id = "" } = input;
        
        if (!user_key || user_key.trim() === '') {
          return "❌ Error: User key is required to create a memory. Please provide your user key or identifier.";
        }
        
        if (!content || content.trim() === '') {
          return "❌ Error: Memory content is required. Please provide the content you want to remember.";
        }
        
        try {
          console.log(`💾 Creating memory for user: ${user_key}`);
          const result = await this.xdbClient.createMemory(user_key, content, tag, session_id);

          if (result.status === "Success") {
            return `✅ Memory created successfully for user "${user_key}"!
📝 Content: ${content}
${tag ? `🏷️ Tag: ${tag}` : ''}
📋 Process ID: ${result.processId || 'N/A'}
💬 Message: ${result.message || 'Memory stored successfully'}`;
          } else {
            const errorDetails = result.details;
            let errorMsg = result.message || 'Unknown error';
            if (errorDetails) {
              errorMsg += `\nDetails: ${JSON.stringify(errorDetails, null, 2)}`;
            }
            return `❌ Failed to create memory: ${errorMsg}`;
          }
        } catch (error: any) {
          return `❌ Error creating memory: ${error.message}`;
        }
      }
    });

    return [listMemoriesTool, createMemoryTool];
  }

  private async createAgent(): Promise<void> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an intelligent memory management assistant powered by XDB AI Connector.

**Your Primary Role:**
- Help users manage their personal memories through XDB
- Always ask for missing information when needed
- Be conversational and helpful

**Key Capabilities:**
🧠 **Memory Operations:**
- List/search user memories with optional filtering
- Create new memories with content, tags, and sessions
- Handle user queries in natural language

**Critical Rules:**
1. **Always ask for user identification**: If no user key is provided, ask the user to identify themselves
2. **Extract information intelligently**: Parse user input to find user keys, memory content, tags, etc.
3. **Validate before acting**: Never proceed with empty or invalid user keys
4. **Be conversational**: Ask follow-up questions when information is missing
5. **Handle errors gracefully**: Provide helpful error messages and suggestions

**User Input Patterns to Recognize:**
- "My user key is john_doe" / "I am john_doe" / "User: john_doe"
- "Remember that I went to Paris" / "Save this memory: I learned TypeScript"
- "Show my memories" / "List memories for alice_smith"
- "Search for memories about travel" / "Find memories tagged as work"

**When Information is Missing:**
- No user key: "I need your user key or identifier to help you. What should I use as your user key?"
- No memory content: "What would you like me to remember for you?"
- Unclear request: Ask clarifying questions

**Response Style:**
- Use emojis to make responses friendly (✅❌🔍💾📝)
- Be concise but informative
- Always confirm what you're doing
- Provide helpful suggestions

Current time: {current_time}
XDB Base URL: {base_url}`],
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
      new MessagesPlaceholder("agent_scratchpad")
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm: this.llm,
      tools: this.tools,
      prompt: prompt
    });

    this.agent = new AgentExecutor({
      agent,
      tools: this.tools,
      memory: this.memory,
      verbose: false,
      handleParsingErrors: true,
      maxIterations: 5
    });
  }

  async chat(message: string): Promise<string> {
    if (!this.agent) {
      throw new Error("Agent not initialized");
    }

    // Store message in conversation history
    this.userSession.conversationHistory.push(message);

    // Extract and store user information for the session
    const extractedUser = UserInputExtractor.extractUserKey(message, this.userSession);
    if (extractedUser && extractedUser !== this.userSession.currentUser) {
      this.userSession.currentUser = extractedUser;
      console.log(`👤 User identified: ${extractedUser}`);
    }

    // Preprocess the message to add context
    let processedMessage = message;
    if (this.userSession.currentUser) {
      processedMessage += ` [Current user context: ${this.userSession.currentUser}]`;
    }

    try {
      const response = await this.agent.invoke({
        input: processedMessage,
        current_time: new Date().toISOString(),
        base_url: this.config.baseUrl
      });
      return response.output;
    } catch (error: any) {
      return `❌ Sorry, I encountered an error: ${error.message}`;
    }
  }

  getCurrentUser(): string | undefined {
    return this.userSession.currentUser;
  }

  setCurrentUser(userKey: string): void {
    this.userSession.currentUser = userKey;
  }

  resetSession(): void {
    this.userSession = {
      conversationHistory: []
    };
    this.memory.clear();
  }

  getConversationHistory(): string[] {
    return [...this.userSession.conversationHistory];
  }
}

// Interactive session function
async function interactiveSession(): Promise<void> {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise(resolve => rl.question(question, resolve));
  };

  console.log("🧠 XDB AI Memory Assistant");
  console.log("=" .repeat(50));
  console.log("🤖 Hello! I'm your personal memory assistant.");
  console.log("💡 I can help you store and retrieve memories using XDB.");
  console.log();
  console.log("📋 What I can do:");
  console.log("   • Store new memories with tags");
  console.log("   • Search and list your existing memories");
  console.log("   • Help organize your thoughts and experiences");
  console.log();
  console.log("💬 Just tell me what you'd like to do in natural language!");
  console.log("   Examples:");
  console.log("   - 'My user key is john_doe, save that I learned TypeScript today'");
  console.log("   - 'I am alice_smith, show me all my travel memories'");
  console.log("   - 'Remember that I had a great meeting with the team, tag it as work'");
  console.log();
  console.log("⌨️  Type 'quit' to exit, 'reset' to clear session, 'help' for more info");
  console.log("-" .repeat(50));

  try {
    const config = XDBConfigLoader.fromEnv();
    const agent = new XDBAIAgent(config);

    while (true) {
      try {
        const userInput = (await askQuestion("\n💬 You: ")).trim();

        if (['quit', 'exit', 'bye'].includes(userInput.toLowerCase())) {
          console.log("👋 Goodbye! Thanks for using XDB Memory Assistant!");
          break;
        }

        if (userInput.toLowerCase() === 'reset') {
          agent.resetSession();
          console.log("🔄 Session reset! Starting fresh.");
          continue;
        }

        if (userInput.toLowerCase() === 'help') {
          console.log("\n📚 Help - How to use XDB Memory Assistant:");
          console.log("🆔 Identify yourself: 'My user key is your_username' or 'I am your_username'");
          console.log("💾 Store memories: 'Remember that...' or 'Save this: ...'");
          console.log("🔍 Find memories: 'Show my memories' or 'Search for memories about...'");
          console.log("🏷️  Add tags: 'Remember X with tag work' or 'tag it as personal'");
          console.log("👤 Current user: " + (agent.getCurrentUser() || "Not set"));
          continue;
        }

        if (!userInput) {
          console.log("💡 Please tell me what you'd like to do, or type 'help' for guidance.");
          continue;
        }

        console.log("\n🤖 Assistant: Processing...");
        const response = await agent.chat(userInput);
        console.log(`🤖 Assistant: ${response}`);

      } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.log(`❌ Failed to initialize agent: ${error.message}`);
    console.log("🔧 Please check your environment variables and try again.");
  } finally {
    rl.close();
  }
}

// Demo function
async function runDemo(): Promise<void> {
  console.log("🧪 Running XDB AI Agent Demo");
  console.log("=" .repeat(50));

  try {
    const config = XDBConfigLoader.fromEnv();
    const agent = new XDBAIAgent(config);

    const testConversations = [
      "Hello! I'd like to use the memory system.",
      "My user key is demo_user_123",
      "Please remember that I completed my first TypeScript project today with tag programming",
      "Also save that I'm planning a vacation to Italy next month, tag it as travel",
      "Show me all my memories",
      "Search for memories about programming"
    ];

    for (let i = 0; i < testConversations.length; i++) {
      console.log(`\n👤 User: ${testConversations[i]}`);
      const response = await agent.chat(testConversations[i]);
      console.log(`🤖 Assistant: ${response}`);
      
      // Small delay for readability
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log("\n✅ Demo completed!");
  } catch (error: any) {
    console.log(`❌ Demo failed: ${error.message}`);
  }
}

// Main execution function
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0] || 'interactive';

  console.log("🔧 XDB AI Agent");
  console.log("=" .repeat(30));

  switch (mode) {
    case 'demo':
      await runDemo();
      break;
      
    case 'interactive':
    default:
      await interactiveSession();
      break;
  }
}

// Export everything
export {
  XDBAIAgent,
  XDBAPIClient,
  XDBConfigLoader,
  UserInputExtractor,
  interactiveSession,
  runDemo
};

// Run main if this is the entry point
if (require.main === module) {
  main().catch(console.error);
}