# XDB AI Connector Library (JavaScript)

A powerful, modular library for integrating XDB memory management with LangChain agents in Node.js applications.

## Features

- **Memory Management**: Store, retrieve, and search user memories
- **LangChain Integration**: Built-in tools for LangChain agents
- **Cryptographic Security**: ECDSA signature support for API authentication
- **Flexible Configuration**: Environment variables, files, or direct configuration
- **Multiple Agent Management**: Handle multiple agents simultaneously
- **TypeScript Ready**: Full schema validation with Zod
- **Streaming Support**: Real-time conversation streaming

## Installation

```bash
npm install axios zod @langchain/openai @langchain/core langchain
```

Then add the XDB AI Connector library to your project:

```bash
# If published to npm
npm install xdb-ai-connector

# Or copy the main file directly
cp xdb-ai-connector.js ./src/
```

## ⚙️ Setup

### Environment Variables

Create a `.env` file in your project root:

```bash
# XDB Configuration
XDB_BASE_URL=http://localhost:5000
XDB_API_KEY=your-xdb-api-key
XDB_PRIVATE_KEY_PATH=/path/to/your/private-key.pem
# OR
XDB_PRIVATE_KEY_CONTENT="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

### Configuration File

Alternatively, create a `config.json` file:

```json
{
  "baseUrl": "http://localhost:5000",
  "apiKey": "your-xdb-api-key",
  "privateKeyPath": "/path/to/your/private-key.pem",
  "privateKeyContent": null
}
```

## Quick Start

### Basic Usage

```javascript
const { createXDBAIAgentFromEnv } = require('./xdb-ai-connector');

async function main() {
  // Create agent from environment variables
  const agent = createXDBAIAgentFromEnv();
  
  // Start chatting
  const response = await agent.chat("List all memories for user 'john_doe'");
  console.log(response);
}

main().catch(console.error);
```

### Create Agent with Explicit Configuration

```javascript
const { createXDBAIAgent } = require('./xdb-ai-connector');

async function main() {
  const agent = createXDBAIAgent({
    baseUrl: 'https://your-xdb-server.com',
    apiKey: 'your-api-key',
    privateKeyPath: './keys/private-key.pem',
    openaiApiKey: 'your-openai-key',
    model: 'gpt-4',
    temperature: 0.2
  });
  
  const response = await agent.chat("Create a memory about my vacation in Tokyo with tag 'travel' for user 'alice'");
  console.log(response);
}
```

## API Reference

### Factory Functions

#### `createXDBAIAgentFromEnv(options)`

Creates an agent using environment variables.

```javascript
const agent = createXDBAIAgentFromEnv({
  openaiApiKey: 'custom-key',  // Override env var
  model: 'gpt-4',              // Default: 'gpt-3.5-turbo'
  temperature: 0.1,            // Default: 0.1
  streaming: true,             // Default: true
  verbose: true                // Default: true
});
```

#### `createXDBAIAgentFromConfig(options)`

Creates an agent from a configuration file.

```javascript
const agent = createXDBAIAgentFromConfig({
  configPath: './config.json',
  openaiApiKey: 'your-key',
  model: 'gpt-4'
});
```

#### `createXDBAIAgent(options)`

Creates an agent with explicit configuration.

```javascript
const agent = createXDBAIAgent({
  baseUrl: 'http://localhost:5000',
  apiKey: 'your-api-key',
  privateKeyPath: './private-key.pem',
  // or privateKeyContent: '-----BEGIN PRIVATE KEY-----...',
  openaiApiKey: 'your-openai-key',
  model: 'gpt-3.5-turbo',
  temperature: 0.1,
  streaming: true,
  verbose: true
});
```

### XDBAIAgent Class

#### Methods

##### `chat(message)`

Main interface to chat with the agent.

```javascript
const response = await agent.chat("What memories do I have about cooking?");
```

##### `resetMemory()`

Reset the conversation memory.

```javascript
await agent.resetMemory();
```

##### `addCustomTool(tool)`

Add a custom LangChain tool to the agent.

```javascript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const customTool = new DynamicStructuredTool({
  name: 'get_weather',
  description: 'Get current weather',
  schema: z.object({
    location: z.string()
  }),
  func: async ({ location }) => {
    return `Weather in ${location}: Sunny, 75°F`;
  }
});

await agent.addCustomTool(customTool);
```

### XDBAgentManager Class

Manage multiple agents simultaneously.

```javascript
const { XDBAgentManager } = require('./xdb-ai-connector');

const manager = new XDBAgentManager();

// Add agents
manager.addAgent('personal', personalAgent);
manager.addAgent('work', workAgent);

// Chat with specific agent
const response = await manager.chatWithAgent('personal', 'List my personal memories');

// List all agents
console.log(manager.listAgents()); // ['personal', 'work']

// Remove agent
manager.removeAgent('work');
```

## Example Conversations

### Listing Memories

```javascript
// List all memories for a user
await agent.chat("List all memories for user 'john_doe'");

// Search memories with query
await agent.chat("Find memories about cooking for user 'john_doe'");

// Filter by tokens
await agent.chat("Show memories with tokens 'recipe', 'food' for user 'john_doe'");
```

### Creating Memories

```javascript
// Basic memory creation
await agent.chat("Create a memory 'Learned to make pasta' for user 'john_doe'");

// With tag and session
await agent.chat("Create a memory about visiting the Eiffel Tower with tag 'travel' and session 'paris_trip_2024' for user 'alice'");

// The agent will ask for missing information
await agent.chat("Remember that I learned something new today");
// Agent: "I'd be happy to help you create that memory! Could you provide your user key and tell me more about what you learned?"
```

## Advanced Usage

### Custom Configuration Class

```javascript
const { XDBConfig } = require('./xdb-ai-connector');

// Create custom configuration
const config = new XDBConfig({
  baseUrl: 'https://api.xdb.example.com',
  apiKey: process.env.CUSTOM_API_KEY,
  privateKeyContent: process.env.PRIVATE_KEY_PEM
});

// Validate configuration
config.validate();

// Use with agent
const agent = new XDBAIAgent({
  config,
  openaiApiKey: process.env.OPENAI_API_KEY
});
```

### Direct API Client Usage

```javascript
const { XDBAPIClient, XDBConfig } = require('./xdb-ai-connector');

const config = XDBConfig.fromEnv();
const client = new XDBAPIClient(config);

// List memories directly
const result = await client.listMemories('user123', ['tag1', 'tag2'], 'search query');
console.log(result);

// Create memory directly
const createResult = await client.createMemory('user123', 'Memory content', 'tag', 'session');
console.log(createResult);

// Health check
const health = await client.healthCheck();
console.log(health);
```

### Error Handling

```javascript
async function robustChat() {
  try {
    const agent = createXDBAIAgentFromEnv();
    const response = await agent.chat("List my memories");
    console.log(response);
  } catch (error) {
    if (error.message.includes('API key')) {
      console.error('Invalid API key. Please check your configuration.');
    } else if (error.message.includes('network')) {
      console.error('Network error. Please check your connection.');
    } else {
      console.error('Unexpected error:', error.message);
    }
  }
}
```

## Security & Authentication

### Private Key Setup

Generate an ECDSA private key for API authentication:

```bash
# Generate private key
openssl ecparam -genkey -name secp256r1 -noout -out private-key.pem

# Extract public key (share with XDB server)
openssl ec -in private-key.pem -pubout -out public-key.pem
```

### Environment Security

```javascript
// Use environment variables for sensitive data
const agent = createXDBAIAgent({
  baseUrl: process.env.XDB_BASE_URL,
  apiKey: process.env.XDB_API_KEY,
  privateKeyPath: process.env.XDB_PRIVATE_KEY_PATH,
  openaiApiKey: process.env.OPENAI_API_KEY
});
```

## Memory Data Structure

Memories returned from XDB have the following structure:

```javascript
{
  memory: "Content of the memory",
  date: "2024-01-15T10:30:00Z",
  transactionNumber: "txn_123456",
  tokens: ["tag1", "tag2", "keyword"],
  language: "en",
  tag: "category",
  sessionId: "session_2024011510"
}
```

## Troubleshooting

### Common Issues

1. **"API key is required" Error**
   ```bash
   # Make sure your API key is set
   export XDB_API_KEY="your-actual-api-key"
   ```

2. **"Private key not found" Warning**
   ```bash
   # Check if your private key file exists
   ls -la /path/to/private-key.pem
   
   # Or set the content directly
   export XDB_PRIVATE_KEY_CONTENT="$(cat private-key.pem)"
   ```

3. **Network Connection Issues**
   ```javascript
   // Test API connectivity
   const { XDBAPIClient, XDBConfig } = require('./xdb-ai-connector');
   const config = XDBConfig.fromEnv();
   const client = new XDBAPIClient(config);
   
   const health = await client.healthCheck();
   console.log('Health check:', health);
   ```

4. **LangChain Errors**
   ```bash
   # Make sure all dependencies are installed
   npm install @langchain/openai @langchain/core langchain
   
   # Check OpenAI API key
   echo $OPENAI_API_KEY
   ```

### Debug Mode

Enable verbose logging:

```javascript
const agent = createXDBAIAgentFromEnv({
  verbose: true,
  streaming: true
});
```

## Examples

### Complete Application Example

```javascript
const { createXDBAIAgentFromEnv } = require('./xdb-ai-connector');
const readline = require('readline');

async function interactiveMemoryBot() {
  const agent = createXDBAIAgentFromEnv();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🤖 XDB Memory Bot started! Type "exit" to quit.\n');

  while (true) {
    const input = await new Promise(resolve => {
      rl.question('You: ', resolve);
    });

    if (input.toLowerCase() === 'exit') {
      break;
    }

    try {
      const response = await agent.chat(input);
      console.log('Bot:', response);
    } catch (error) {
      console.error('Error:', error.message);
    }
    
    console.log(); // Empty line for readability
  }

  rl.close();
  console.log('Goodbye! 👋');
}

// Run the interactive bot
interactiveMemoryBot().catch(console.error);
```

### Express.js API Server

```javascript
const express = require('express');
const { createXDBAIAgentFromEnv } = require('./xdb-ai-connector');

const app = express();
app.use(express.json());

const agent = createXDBAIAgentFromEnv();

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await agent.chat(message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/reset', async (req, res) => {
  try {
    await agent.resetMemory();
    res.json({ message: 'Memory reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('XDB Memory API server running on port 3000');
});
```

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here]

## Support

- Documentation: [Your docs URL]
- Issues: [Your GitHub issues URL]
- Email: [Your support email]

---

**Happy memory managing with XDB AI Connector! **