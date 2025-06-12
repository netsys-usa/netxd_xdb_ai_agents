import { Tool, ListMemoriesInput, CreateMemoryInput } from '../types';
import { XDBAPIClient } from '../client/XDBAPIClient';

export class XDBToolFactory {
  private xdbClient: XDBAPIClient;

  constructor(xdbClient: XDBAPIClient) {
    this.xdbClient = xdbClient;
  }

  createListMemoriesTool(): Tool {
    return {
      name: 'list_memories',
      description: 'List all memories for a user. You can optionally filter by tokens or search with a query string.',
      parameters: {
        type: 'object',
        properties: {
          userKey: { type: 'string', description: 'The user key to list memories for' },
          tokens: { type: 'array', items: { type: 'string' }, description: 'Optional list of tokens to filter memories' },
          query: { type: 'string', description: 'Optional query string to search memories' }
        },
        required: ['userKey']
      },
      execute: async (params: ListMemoriesInput): Promise<string> => {
        try {
          const result = await this.xdbClient.listMemories(params.userKey, params.tokens, params.query || '');
          
          if (result.status === 'Success') {
            const memories = result.data?.memories || [];
            if (memories.length === 0) {
              return 'No memories found for this user.';
            }

            const formattedMemories = memories.map((memory: any, index: number) => 
              `Memory ${index + 1}:
                - Content: ${memory.memory || 'N/A'}
                - Date: ${memory.date || 'N/A'}
                - Transaction: ${memory.transactionNumber || 'N/A'}
                - Tokens: ${memory.tokens?.join(', ') || 'None'}
                - Language: ${memory.language || 'Not specified'}`
            );

            return `Found ${memories.length} memories:\n\n${formattedMemories.join('\n\n')}`;
          } else {
            return `Error: ${result.message}`;
          }
        } catch (error) {
          return `Error listing memories: ${error}`;
        }
      }
    };
  }

  createCreateMemoryTool(): Tool {
    return {
      name: 'create_memory',
      description: 'Create a new memory for a user. Requires user key and content. Optional tag and session ID can be provided.',
      parameters: {
        type: 'object',
        properties: {
          userKey: { type: 'string', description: 'The user key to create memory for' },
          content: { type: 'string', description: 'The content/text of the memory to store' },
          tag: { type: 'string', description: 'Optional tag for categorizing the memory' },
          sessionId: { type: 'string', description: 'Optional session ID for grouping memories' }
        },
        required: ['userKey', 'content']
      },
      execute: async (params: CreateMemoryInput): Promise<string> => {
        try {
          const result = await this.xdbClient.createMemory(
            params.userKey,
            params.content,
            params.tag || '',
            params.sessionId
          );

          if (result.status === 'Success') {
            return `Memory created successfully!\nMessage: ${result.message}\nProcess ID: ${result.processId || 'N/A'}`;
          } else {
            return `Failed to create memory: ${result.message}`;
          }
        } catch (error) {
          return `Error creating memory: ${error}`;
        }
      }
    };
  }

  createAllTools(): Tool[] {
    return [
      this.createListMemoriesTool(),
      this.createCreateMemoryTool()
    ];
  }
}