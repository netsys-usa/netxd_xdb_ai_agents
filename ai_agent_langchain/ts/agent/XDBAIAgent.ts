import OpenAI from 'openai';
import { XDBConfig, ChatMessage, Tool } from '../types';
import { XDBAPIClient } from '../client/XDBAPIClient';
import { XDBToolFactory } from '../tools/XDBToolFactory';

export interface XDBAIAgentOptions {
  config: XDBConfig;
  openaiApiKey?: string;
  model?: string;
  temperature?: number;
  streaming?: boolean;
  verbose?: boolean;
}

export class XDBAIAgent {
  private config: XDBConfig;
  private xdbClient: XDBAPIClient;
  private openai: OpenAI;
  private tools: Tool[];
  private chatHistory: ChatMessage[] = [];
  private verbose: boolean;
  private model: string;
  private temperature: number;

  constructor(options: XDBAIAgentOptions) {
    this.config = options.config;
    this.xdbClient = new XDBAPIClient(options.config);
    this.verbose = options.verbose ?? true;
    this.model = options.model || 'gpt-4';
    this.temperature = options.temperature ?? 0.1;

    this.openai = new OpenAI({
      apiKey: options.openaiApiKey || process.env.OPENAI_API_KEY
    });

    const toolFactory = new XDBToolFactory(this.xdbClient);
    this.tools = toolFactory.createAllTools();

    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt(): void {
    const systemPrompt = `You are an intelligent memory management assistant powered by XDB AI Connector.            
You can help users with:
**Memory Management:**
- List memories for any user (with optional filtering by tokens or search queries)
- List memories, understand the user query, extract search query and populate query and DO NOT suggest, just extract and execute the query.
- Understand user query and extract search query, the query can be just a verb or noun, unless user asks to list all his memories, always extract key verbs or nouns for search.
- Create new memories with content, tags, and session grouping
- Search through existing memories using natural language queries

**Important Notes:**
- Always ask for a user key when it's needed for operations
- When creating memories, record the memory as is, DO NOT suggest for improvement.
- Handle errors gracefully and provide helpful feedback

**User Experience:**
- Be conversational and helpful
- Explain what you're doing when performing operations
- Summarize the memory in natural language
- Provide suggestions for better memory organization`;

    this.chatHistory = [{ role: 'system', content: systemPrompt }];
  }

  async chat(message: string): Promise<string> {
    try {
      this.chatHistory.push({ role: 'user', content: message });

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: this.chatHistory,
        temperature: this.temperature,
        tools: this.tools.map(tool => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        })),
        tool_choice: 'auto'
      });

      const assistantMessage = response.choices[0].message;
      
      if (assistantMessage.tool_calls) {
        // Handle tool calls
        const toolResults: string[] = [];
        
        for (const toolCall of assistantMessage.tool_calls) {
          const tool = this.tools.find(t => t.name === toolCall.function.name);
          if (tool) {
            const params = JSON.parse(toolCall.function.arguments);
            const result = await tool.execute(params);
            toolResults.push(result);
          }
        }

        // Get final response after tool execution
        this.chatHistory.push({
          role: 'assistant',
          content: assistantMessage.content || 'I executed the requested operations.'
        });

        const finalResponse = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            ...this.chatHistory,
            {
              role: 'user',
              content: `Based on the tool results: ${toolResults.join('\n\n')}, please provide a natural language response to the user.`
            }
          ],
          temperature: this.temperature
        });

        const finalMessage = finalResponse.choices[0].message.content || 'Operation completed.';
        this.chatHistory.push({ role: 'assistant', content: finalMessage });
        return finalMessage;
      } else {
        const content = assistantMessage.content || 'I apologize, but I could not process your request.';
        this.chatHistory.push({ role: 'assistant', content });
        return content;
      }
    } catch (error) {
      return `Sorry, I encountered an error: ${error}`;
    }
  }

  resetMemory(): void {
    this.chatHistory = this.chatHistory.slice(0, 1); // Keep only system prompt
  }

  addCustomTool(tool: Tool): void {
    this.tools.push(tool);
  }
}