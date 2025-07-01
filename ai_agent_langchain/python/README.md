### For registration to get an API key
### Please contact anp@netxd.com

### For complete API details
https://documenter.getpostman.com/view/34398137/2sB2qgfypF

### From Source
```bash
git clone https://github.com/netsys-usa/netxd_xdb_ai_agents.git
cd ai_agent_langchain/python
pip install -e .
```

## ⚡ Quick Start

### 1. Set Environment Variables

```bash
export XDB_BASE_URL="http://localhost:5000"
export XDB_API_KEY="your-xdb-api-key"
export XDB_PRIVATE_KEY_PATH="/path/to/private-key.pem"
export OPENAI_API_KEY="your-openai-api-key"
```

### 2. Basic Usage

```python
from xdb_ai_agent import create_xdb_agent_from_env

# Create agent from environment variables
agent = create_xdb_agent_from_env()

# Start chatting - Memory Management
response = agent.chat("List all memories for user 'john_doe'")
print(response)

# Create a memory
response = agent.chat("Create a memory about learning Python with tag 'education' for user 'alice'")
print(response)

# Reminder Management
response = agent.chat("Remind me to call mom at 3pm tomorrow for user 'bob'")
print(response)

# List reminders
response = agent.chat("List all reminders for user 'bob'")
print(response)

# Process transcript
response = agent.chat("Process transcript file /path/to/meeting.json with tag 'meeting' for user 'alice'")
print(response)
```

### 3. Using Configuration File

```python
from xdb_ai_agent import create_xdb_agent_from_config

# Create config.json file
config = {
    "baseUrl": "http://localhost:5000",
    "apiKey": "your-api-key",
    "privateKeyPath": "/path/to/private-key.pem"
}

# Create agent from config file
agent = create_xdb_agent_from_config("config.json", openai_api_key="your-key")
response = agent.chat("What memories do I have about cooking?")
```

## 🔐 Memory Encryption & Decryption

The XDB AI Agent supports encrypted memories with automatic decryption when viewing. This provides an additional layer of security for sensitive information.

### How Memory Encryption Works

1. **Encrypted Storage**: Memories can be stored in encrypted format on the XDB server
2. **Automatic Decryption**: When listing memories, the agent automatically detects and decrypts encrypted content
3. **RSA Encryption**: Uses RSA-OAEP encryption for secure memory storage

### Decryption Configuration

To enable automatic decryption of encrypted memories, you need to configure the RSA private key in the tool factory:

```python
# In tools/factory.py, update the private_key variable with your RSA private key
private_key = """-----BEGIN RSA PRIVATE KEY-----
YOUR_RSA_PRIVATE_KEY_CONTENT_HERE
-----END RSA PRIVATE KEY-----"""
```

### Memory Response Format

When listing memories, the response includes encryption status:

```python
# Example decrypted memory output
"""Memory 1:
- Content: [Decrypted content]
- Date: 2024-01-15T10:30:00Z
- Transaction: txn_123456
- Tokens: [decrypted, tags]
- Language: en
- Encrypted: True"""
```

### Security Considerations

- **Private Key Security**: Store your RSA private key securely and never commit it to version control
- **Key Rotation**: Regularly rotate encryption keys for enhanced security
- **Access Control**: Ensure only authorized applications have access to the private key
- **Environment Variables**: Consider storing the private key as an environment variable

### Setting Up RSA Keys for Encryption

```bash
# Generate RSA key pair (if not already provided by XDB)
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem

# Set proper permissions
chmod 600 private_key.pem
chmod 644 public_key.pem
```

## API Reference

### Core Classes

#### `XDBAIAgent`

The main agent class for interacting with XDB memory management and reminder system.

```python
from xdb_ai_agent import XDBAIAgent, XDBConfig

config = XDBConfig(
    base_url="http://localhost:5000",
    api_key="your-api-key",
    private_key_path="/path/to/key.pem"
)

agent = XDBAIAgent(
    config=config,
    openai_api_key="your-openai-key",
    model="gpt-4o",  # Default: "gpt-4o"
    temperature=0.1,  # Default: 0.1
    streaming=True,  # Default: True
    verbose=True  # Default: True
)
```

#### Key Methods

```python
# Chat with the agent
response = agent.chat("Your message here")

# Reset conversation memory
agent.reset_memory()

# Add custom tools
from langchain.tools import Tool
custom_tool = Tool(name="custom", description="desc", func=lambda x: "result")
agent.add_custom_tool(custom_tool)
```

### Factory Functions

#### `create_xdb_agent_from_env()`

```python
from xdb_ai_agent import create_xdb_agent_from_env

agent = create_xdb_agent_from_env(
    openai_api_key="custom-key",  # Override env var
    model="gpt-4o",
    temperature=0.2,
    streaming=False,
    verbose=False
)
```

#### `create_xdb_agent_from_config()`

```python
from xdb_ai_agent import create_xdb_agent_from_config

agent = create_xdb_agent_from_config(
    config_path="./config.json",
    openai_api_key="your-key",
    model="gpt-4o"
)
```

#### `create_xdb_agent()`

```python
from xdb_ai_agent import create_xdb_agent

agent = create_xdb_agent(
    base_url="http://localhost:5000",
    api_key="your-api-key",
    private_key_path="/path/to/key.pem",
    openai_api_key="your-openai-key"
)
```

### Configuration Management

#### `XDBConfig`

```python
from xdb_ai_agent import XDBConfig

# From environment
config = XDBConfig.from_env()

# From file
config = XDBConfig.from_file("config.json")

# Direct instantiation
config = XDBConfig(
    base_url="http://localhost:5000",
    api_key="your-key",
    private_key_path="/path/to/key.pem"
)

# Validate configuration
config.validate()  # Raises XDBValidationError if invalid
```

### Direct API Client

```python
from xdb_ai_agent import XDBAPIClient, XDBConfig

config = XDBConfig.from_env()
client = XDBAPIClient(config)

# Memory operations
response = client.list_memories("user123", tokens=["tag1"], query="cooking")
response = client.create_memory("user123", "Learned to make pasta", tag="cooking")

# Reminder operations  
response = client.list_reminders("user123", tokens=["work"], query="meeting")
response = client.create_reminder("user123", "Call client at 2pm", tag="work")

# Transcript processing
response = client.process_transcript_text("user123", "/path/to/transcript.json", "meeting")

# Health check
response = client.health_check()
```

### Agent Manager

```python
from xdb_ai_agent import XDBAgentManager, create_xdb_agent_from_env

manager = XDBAgentManager()

# Add agents
personal_agent = create_xdb_agent_from_env()
work_agent = create_xdb_agent_from_env()

manager.add_agent("personal", personal_agent)
manager.add_agent("work", work_agent)

# Chat with specific agent
response = manager.chat_with_agent("personal", "List my personal memories")

# List all agents
agents = manager.list_agents()  # ["personal", "work"]

# Remove agent
manager.remove_agent("work")
```

## Conversation Examples

### Memory Management

```python
agent = create_xdb_agent_from_env()

# List all memories (automatically decrypts encrypted content)
response = agent.chat("List all memories for user 'john_doe'")

# Search for specific memories
response = agent.chat("Find memories about cooking for user 'chef_alice'")

# Create a detailed memory
response = agent.chat("""
Create a memory for user 'student_bob': 
'Completed Python course on machine learning. Learned about neural networks, 
regression, and classification algorithms.' 
Tag it as 'education' and session 'ml_course_2024'
""")

# Filter by tokens
response = agent.chat("Show memories with tokens 'recipe', 'italian' for user 'chef_alice'")
```

### Working with Encrypted Memories

```python
agent = create_xdb_agent_from_env()

# List memories - encrypted memories are automatically decrypted for display
response = agent.chat("List all memories for user 'secure_user'")
# Output will show decrypted content with encryption status indicator

# Create sensitive memories (encryption handled server-side based on configuration)
response = agent.chat("""
Create a memory for user 'secure_user': 
'Password for banking account: SecurePass123' 
Tag it as 'credentials'
""")

# Search through encrypted memories (search works on decrypted content)
response = agent.chat("Find memories about passwords for user 'secure_user'")
```

### Reminder Management

```python
agent = create_xdb_agent_from_env()

# Create reminders with time/date context
response = agent.chat("Remind user 'alice' to submit report by Friday")
response = agent.chat("Set a reminder for user 'bob' to call dentist tomorrow at 2pm")

# List reminders
response = agent.chat("List all reminders for user 'alice'")
response = agent.chat("Show work-related reminders for user 'bob'")

# Search reminders by query
response = agent.chat("Find reminders about meetings for user 'manager_sarah'")
```

### Transcript Processing

```python
agent = create_xdb_agent_from_env()

# Process different transcript formats
response = agent.chat("Process transcript file /path/to/zoom_meeting.json with tag 'team-meeting' for user 'alice'")
response = agent.chat("Process transcript /path/to/interview.txt with tag 'hiring' for user 'hr_manager'")

# The agent automatically detects:
# - Zoom transcript format (JSON with speaker_name, start_time, end_time)
# - Custom JSON format with sentence and speaker_name
# - Plain text transcripts
```

### Advanced Usage

```python
# Multi-turn conversation with different tools
agent = create_xdb_agent_from_env()

agent.chat("I want to work with user alice's data")
agent.chat("First, show me her recent memories about meetings")
agent.chat("Now set a reminder for her to follow up on the budget discussion")
agent.chat("Also process this transcript file /path/to/meeting.json with tag 'budget-meeting'")
agent.chat("Finally, show all her work-related reminders")
```

## Advanced Configuration

### Encryption Configuration

Configure RSA decryption in your application:

```python
from xdb_ai_agent.tools.factory import XDBToolFactory
from xdb_ai_agent.utils.rsa_encryption_service import RSAEncryption
from Crypto.PublicKey import RSA

# Method 1: Update private key in factory.py
# Edit tools/factory.py and add your RSA private key

# Method 2: Configure RSA service directly (future enhancement)
rsa_service = RSAEncryption()
with open('/path/to/private_key.pem', 'r') as f:
    private_key_content = f.read()
rsa_service.private_key = RSA.import_key(private_key_content)
```

### Custom Tools

```python
from xdb_ai_agent import create_xdb_agent_from_env
from langchain.tools import Tool

def get_weather(location: str) -> str:
    return f"Weather in {location}: Sunny, 75°F"

weather_tool = Tool(
    name="get_weather",
    description="Get current weather for a location",
    func=get_weather
)

agent = create_xdb_agent_from_env()
agent.add_custom_tool(weather_tool)

response = agent.chat("What's the weather in Paris?")
```

### Error Handling

```python
from xdb_ai_agent import (
    create_xdb_agent_from_env, 
    XDBError, 
    XDBAuthenticationError,
    XDBValidationError
)

try:
    agent = create_xdb_agent_from_env()
    response = agent.chat("List memories for user 'test'")
    print(response)
except XDBAuthenticationError:
    print("Authentication failed. Check your API key.")
except XDBValidationError:
    print("Configuration validation failed.")
except XDBError as e:
    print(f"XDB error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

### Logging Configuration

```python
import logging
from xdb_ai_agent import create_xdb_agent_from_env

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("xdb_ai_agent")

# Create agent with verbose output
agent = create_xdb_agent_from_env(verbose=True)
```

## Security & Authentication

### Private Key Setup

Generate ECDSA private key for API authentication:

```bash
# Generate private key
openssl ecparam -genkey -name secp256r1 -noout -out private-key.pem

# Extract public key (share with XDB server)
openssl ec -in private-key.pem -pubout -out public-key.pem

# Set permissions
chmod 600 private-key.pem
```

### RSA Key Setup for Memory Encryption

Generate RSA keys for memory encryption/decryption:

```bash
# Generate RSA private key for memory encryption
openssl genrsa -out rsa_private_key.pem 2048

# Extract RSA public key (share with XDB server for encryption)
openssl rsa -in rsa_private_key.pem -pubout -out rsa_public_key.pem

# Set proper permissions
chmod 600 rsa_private_key.pem
chmod 644 rsa_public_key.pem
```

### Environment Variables Security

```python
import os
from xdb_ai_agent import create_xdb_agent

# Load from environment with fallbacks
agent = create_xdb_agent(
    base_url=os.getenv("XDB_BASE_URL", "http://localhost:5000"),
    api_key=os.getenv("XDB_API_KEY"),
    private_key_path=os.getenv("XDB_PRIVATE_KEY_PATH"),
    openai_api_key=os.getenv("OPENAI_API_KEY")
)
```

### Using Environment Files

```python
from dotenv import load_dotenv
from xdb_ai_agent import create_xdb_agent_from_env

# Load .env file
load_dotenv()

# Create agent
agent = create_xdb_agent_from_env()
```

## Real-World Examples

### 1. Interactive CLI Bot with Encryption Support

```python
#!/usr/bin/env python3
"""Interactive memory and reminder management bot with encryption support"""

from xdb_ai_agent import create_xdb_agent_from_env
import readline  # For better input handling

def main():
    agent = create_xdb_agent_from_env(verbose=True)
    print("🤖 XDB Memory & Reminder Bot started! Type 'exit' to quit.\n")
    print("Features: Memory storage, Reminder creation, Transcript processing")
    print("🔐 Encryption: Automatic decryption of encrypted memories\n")
    
    while True:
        try:
            user_input = input("You: ").strip()
            if user_input.lower() in ['exit', 'quit', 'q']:
                break
            
            if not user_input:
                continue
                
            response = agent.chat(user_input)
            print(f"Bot: {response}\n")
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}\n")
    
    print("Goodbye!")

if __name__ == "__main__":
    main()
```

### 2. Flask Web API with Encryption Features

```python
from flask import Flask, request, jsonify
from xdb_ai_agent import create_xdb_agent_from_env, XDBAgentManager

app = Flask(__name__)
manager = XDBAgentManager()

# Create default agent
default_agent = create_xdb_agent_from_env(streaming=False)
manager.add_agent("default", default_agent)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")
    agent_name = data.get("agent", "default")
    
    try:
        response = manager.chat_with_agent(agent_name, message)
        return jsonify({"response": response, "success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/memories/<user_key>", methods=["GET"])
def get_memories(user_key):
    """Get memories for a user (with automatic decryption)"""
    try:
        agent = manager.get_agent("default")
        message = f"List all memories for user '{user_key}'"
        response = agent.chat(message)
        return jsonify({"response": response, "success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/upload-transcript", methods=["POST"])
def upload_transcript():
    """Handle transcript file uploads"""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    user_key = request.form.get('user_key')
    tag = request.form.get('tag', 'transcript')
    
    if not user_key:
        return jsonify({"error": "user_key required"}), 400
    
    # Save file temporarily
    file_path = f"/tmp/{file.filename}"
    file.save(file_path)
    
    try:
        agent = manager.get_agent("default")
        message = f"Process transcript file {file_path} with tag '{tag}' for user '{user_key}'"
        response = agent.chat(message)
        return jsonify({"response": response, "success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
```

## Supported Transcript Formats

The XDB AI Agent supports multiple transcript formats:

### 1. Zoom Transcript Format (JSON)
```json
{
  "transcript": {
    "transcript_content": [
      {
        "speaker_name": "John Doe",
        "text": "Welcome to today's meeting."
      }
    ]
  }
}
```

### 2. Custom JSON Format
```json
[
  {
    "speaker_name": "Alice",
    "sentence": "Let's discuss the quarterly results.",
    "startTime": "00:01:30",
    "endTime": "00:01:35"
  }
]
```

### 3. Plain Text Format
```
Speaker 1: Hello everyone, thanks for joining.
Speaker 2: Happy to be here, let's get started.
```

## Testing

### Running Tests

```bash
# Install test dependencies
pip install xdb-ai-agent[test]

# Run all tests
pytest

# Run with coverage
pytest --cov=xdb_ai_agent

# Run specific test file
pytest tests/test_agent.py

# Run with verbose output
pytest -v
```

### Testing Encryption Functionality

```python
import pytest
from xdb_ai_agent import create_xdb_agent_from_env
from xdb_ai_agent.utils.rsa_encryption_service import RSAEncryption
from Crypto.PublicKey import RSA

def test_encrypted_memory_retrieval():
    """Test that encrypted memories are properly decrypted"""
    agent = create_xdb_agent_from_env()
    
    # This would test with a mock encrypted memory
    response = agent.chat("List all memories for user 'test_encrypted_user'")
    
    # Verify that response contains decrypted content
    assert "Encrypted: True" in response or "Encrypted: False" in response

def test_rsa_decryption():
    """Test RSA decryption functionality"""
    rsa_service = RSAEncryption()
    
    # Test with a mock private key and encrypted data
    # This would require setting up test data
    pass
```

## Troubleshooting

### Common Issues

#### 1. Import Error

```python
# Error: ModuleNotFoundError: No module named 'xdb_ai_agent'
# Solution:
pip install xdb-ai-connector

# For development:
pip install -e .
```

#### 2. Authentication Error

```python
# Error: XDBAuthenticationError
# Check your API key and private key configuration
import os
print("API Key:", os.getenv("XDB_API_KEY"))
print("Private Key Path:", os.getenv("XDB_PRIVATE_KEY_PATH"))
```

#### 3. Encryption/Decryption Issues

```python
# Error: Unable to decrypt memories
# Check RSA private key configuration
from xdb_ai_agent.tools.factory import XDBToolFactory

# Verify private key is properly loaded
# Check that private_key variable in factory.py contains valid RSA key
```

#### 4. LangChain Version Conflicts

```bash
# Upgrade to compatible versions
pip install --upgrade langchain langchain-openai
```

#### 5. Crypto Library Issues

```bash
# Install required cryptography libraries
pip install pycryptodome cryptography
```

### Debug Mode

```python
import logging
from xdb_ai_agent import create_xdb_agent_from_env

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

# Create agent with verbose output
agent = create_xdb_agent_from_env(verbose=True)

# Test encryption/decryption
try:
    response = agent.chat("List memories for user 'test'")
    print("Success:", response)
except Exception as e:
    print("Error:", e)
```

### Encryption Debug Checklist

```python
# Check RSA key configuration
from Crypto.PublicKey import RSA

# Test private key loading
try:
    with open('/path/to/rsa_private_key.pem', 'r') as f:
        private_key_content = f.read()
    private_key = RSA.import_key(private_key_content)
    print("RSA private key loaded successfully")
    print(f"Key size: {private_key.size_in_bits()} bits")
except Exception as e:
    print(f"RSA key error: {e}")
```

## Additional Resources

### Memory Data Structure with Encryption

Memories returned from XDB have this structure:

```python
{
    "memory": "Content of the memory (encrypted or plain)",
    "date": "2024-01-15T10:30:00Z",
    "transactionNumber": "txn_123456",
    "tokens": ["tag1", "tag2", "keyword"],  # May be encrypted
    "language": "en",
    "tag": "category",
    "sessionId": "session_2024011510",
    "isEncrypted": True  # Indicates if memory is encrypted
}
```

### Encryption Service Integration

The XDB AI Agent includes built-in RSA decryption:

1. **RSAEncryption Service** - Handles RSA-OAEP decryption
2. **Automatic Detection** - Detects encrypted memories via `isEncrypted` flag
3. **Transparent Decryption** - Decrypts content and tokens automatically
4. **Error Handling** - Gracefully handles decryption failures

### Available Tools Summary

The XDB AI Agent includes these built-in tools:

1. **list_memories** - List and search user memories with automatic decryption
2. **create_memory** - Create new memories with content, tags, and session grouping
3. **list_reminders** - List and search user reminders with optional filtering  
4. **create_reminder** - Create new reminders with time/date context
5. **process_transcript_text** - Process transcript files in multiple formats