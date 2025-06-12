export interface XDBConfig {
    baseUrl: string;
    apiKey: string;
    privateKeyPath?: string;
    privateKeyContent?: string;
  }
  
  export interface MemoryRecord {
    memory: string;
    date: string;
    transactionNumber: string;
    tokens: string[];
    language?: string;
    tag?: string;
    sessionId?: string;
  }
  
  export interface XDBResponse {
    status: string;
    message: string;
    data?: Record<string, any>;
    error?: boolean;
    processId?: string;
  }
  
  export interface ListMemoriesInput {
    userKey: string;
    tokens?: string[];
    query?: string;
  }
  
  export interface CreateMemoryInput {
    userKey: string;
    content: string;
    tag?: string;
    sessionId?: string;
  }
  
  export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }
  
  export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, any>;
    execute: (params: any) => Promise<string>;
  }