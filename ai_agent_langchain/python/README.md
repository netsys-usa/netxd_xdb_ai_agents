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

# List all memories
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

### 1. Interactive CLI Bot

```python
#!/usr/bin/env python3
"""Interactive memory and reminder management bot"""

from xdb_ai_agent import create_xdb_agent_from_env
import readline  # For better input handling

def main():
    agent = create_xdb_agent_from_env(verbose=True)
    print("🤖 XDB Memory & Reminder Bot started! Type 'exit' to quit.\n")
    print("Features: Memory storage, Reminder creation, Transcript processing\n")
    
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

### 2. Flask Web API with All Features

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

@app.route("/agents", methods=["GET"])
def list_agents():
    return jsonify({"agents": manager.list_agents()})

@app.route("/reset/<agent_name>", methods=["POST"])
def reset_agent(agent_name):
    agent = manager.get_agent(agent_name)
    if agent:
        agent.reset_memory()
        return jsonify({"message": f"Agent {agent_name} memory reset"})
    return jsonify({"error": "Agent not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5001)
```

### 3. Async FastAPI Server with Enhanced Features

```python
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from xdb_ai_agent import create_xdb_agent_from_env
import asyncio
import tempfile
import os

app = FastAPI(title="XDB Memory & Reminder API")

# Global agent
agent = None

class ChatRequest(BaseModel):
    message: str
    user_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    success: bool

class TranscriptRequest(BaseModel):
    user_key: str
    tag: str = "transcript"

@app.on_event("startup")
async def startup_event():
    global agent
    agent = create_xdb_agent_from_env(streaming=False)

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            agent.chat, 
            f"User {request.user_id}: {request.message}"
        )
        return ChatResponse(response=response, success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-transcript")
async def upload_transcript(
    file: UploadFile = File(...),
    user_key: str = Form(...),
    tag: str = Form("transcript")
):
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Process with agent
        loop = asyncio.get_event_loop()
        message = f"Process transcript file {tmp_file_path} with tag '{tag}' for user '{user_key}'"
        response = await loop.run_in_executor(None, agent.chat, message)
        
        # Clean up temporary file
        os.unlink(tmp_file_path)
        
        return {"response": response, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset")
async def reset_memory():
    agent.reset_memory()
    return {"message": "Memory reset successfully"}

# Run with: uvicorn main:app --reload
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

### Writing Tests

```python
import pytest
from xdb_ai_agent import XDBConfig, XDBAPIClient
from xdb_ai_agent.utils.exceptions import XDBValidationError

def test_config_validation():
    # Valid config
    config = XDBConfig(
        base_url="http://localhost:5000",
        api_key="test-key",
        private_key_path="/path/to/key.pem"
    )
    assert config.validate() == True

def test_invalid_config():
    # Invalid config - no API key
    with pytest.raises(XDBValidationError):
        config = XDBConfig(
            base_url="http://localhost:5000",
            api_key="",
            private_key_path="/path/to/key.pem"
        )
        config.validate()

@pytest.fixture
def mock_client(monkeypatch):
    """Mock XDB API client for testing"""
    def mock_list_memories(*args, **kwargs):
        return {
            "status": "Success",
            "data": {"memories": []},
            "message": "Success"
        }
    
    def mock_list_reminders(*args, **kwargs):
        return {
            "status": "Success", 
            "data": {"reminders": []},
            "message": "Success"
        }
    
    monkeypatch.setattr("xdb_ai_agent.core.client.XDBAPIClient.list_memories", mock_list_memories)
    monkeypatch.setattr("xdb_ai_agent.core.client.XDBAPIClient.list_reminders", mock_list_reminders)
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

#### 3. LangChain Version Conflicts

```bash
# Upgrade to compatible versions
pip install --upgrade langchain langchain-openai
```

#### 4. OpenAI API Issues

```python
# Test OpenAI connection
import openai
openai.api_key = "your-key"
# Try a simple completion
```

#### 5. Transcript Processing Issues

```python
# Check file format and permissions
import os
transcript_path = "/path/to/transcript.json"
print(f"File exists: {os.path.exists(transcript_path)}")
print(f"File readable: {os.access(transcript_path, os.R_OK)}")

# Test file format detection
from xdb_ai_agent.utils.file_types import file_type_service
print(f"Is JSON: {file_type_service.is_json_file(transcript_path)}")
print(f"Zoom format: {file_type_service.detect_zoom_transcript_format(transcript_path)}")
```

### Debug Mode

```python
import logging
from xdb_ai_agent import create_xdb_agent_from_env

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

# Create agent with verbose output
agent = create_xdb_agent_from_env(verbose=True)

# Test basic functionality
try:
    response = agent.chat("Hello, can you help me?")
    print("Success:", response)
except Exception as e:
    print("Error:", e)
```

### Environment Variables Checklist

```bash
# Required variables
echo "XDB_BASE_URL: $XDB_BASE_URL"
echo "XDB_API_KEY: $XDB_API_KEY"
echo "OPENAI_API_KEY: $OPENAI_API_KEY"

# One of these is required
echo "XDB_PRIVATE_KEY_PATH: $XDB_PRIVATE_KEY_PATH"
echo "XDB_PRIVATE_KEY_CONTENT: $XDB_PRIVATE_KEY_CONTENT"
```

## Additional Resources

### Command Line Interface

The library includes a CLI tool for quick interactions:

```bash
# Interactive mode
xdb-cli --interactive

# Interactive mode with custom tools
xdb-cli --interactive_custom

# Single command
xdb-cli --message "List memories for user john_doe"

# Show version
xdb-cli --version
```

### Memory Data Structure

Memories returned from XDB have this structure:

```python
{
    "memory": "Content of the memory",
    "date": "2024-01-15T10:30:00Z",
    "transactionNumber": "txn_123456",
    "tokens": ["tag1", "tag2", "keyword"],
    "language": "en",
    "tag": "category",
    "sessionId": "session_2024011510"
}
```

### Reminder Data Structure

Reminders returned from XDB have this structure:

```python
{
    "reminder": "Content of the reminder",
    "eventDate": "2024-01-20T15:00:00Z",
    "event": "Meeting with client",
    "tag": "work",
    "sessionId": "session_2024011510"
}
```

### Available Tools Summary

The XDB AI Agent includes these built-in tools:

1. **list_memories** - List and search user memories with optional filtering
2. **create_memory** - Create new memories with content, tags, and session grouping
3. **list_reminders** - List and search user reminders with optional filtering  
4. **create_reminder** - Create new reminders with time/date context
5. **process_transcript_text** - Process transcript files in multiple formats

### Custom Tool Development

```python
from langchain.tools import Tool
from xdb_ai_agent import create_xdb_agent_from_env

def search_web(query: str) -> str:
    """Custom web search tool"""
    # Implement web search logic
    return f"Search results for: {query}"

# Create custom tool
web_search_tool = Tool(
    name="web_search",
    description="Search the web for information",
    func=search_web
)

# Add to agent
agent = create_xdb_agent_from_env()
agent.add_custom_tool(web_search_tool)

# Now the agent can use web search
response = agent.chat("Search for the latest news about AI")
```

### Integration with Other Frameworks

#### Streamlit Integration

```python
import streamlit as st
from xdb_ai_agent import create_xdb_agent_from_env

@st.cache_resource
def get_agent():
    return create_xdb_agent_from_env(streaming=False)

st.title("XDB Memory & Reminder Assistant")

# File upload for transcripts
uploaded_file = st.file_uploader("Upload Transcript", type=['json', 'txt', 'vtt'])
if uploaded_file:
    user_key = st.text_input("User Key")
    tag = st.text_input("Tag", value="transcript")
    
    if st.button("Process Transcript"):
        # Save and process file
        with open(f"/tmp/{uploaded_file.name}", "wb") as f:
            f.write(uploaded_file.getbuffer())
        
        agent = get_agent()
        message = f"Process transcript file /tmp/{uploaded_file.name} with tag '{tag}' for user '{user_key}'"
        response = agent.chat(message)
        st.success(response)

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Chat input
if prompt := st.chat_input("What would you like to know about your memories or reminders?"):
    # Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    
    # Get agent response
    agent = get_agent()
    with st.chat_message("assistant"):
        response = agent.chat(prompt)
        st.markdown(response)
    
    # Add assistant message
    st.session_state.messages.append({"role": "assistant", "content": response})
```

#### Gradio Integration

```python
import gradio as gr
from xdb_ai_agent import create_xdb_agent_from_env

# Initialize agent
agent = create_xdb_agent_from_env(streaming=False)

def chat_with_agent(message, history):
    """Chat function for Gradio interface"""
    try:
        response = agent.chat(message)
        return response
    except Exception as e:
        return f"Error: {str(e)}"

def process_transcript_file(file, user_key, tag):
    """Process uploaded transcript file"""
    try:
        message = f"Process transcript file {file.name} with tag '{tag}' for user '{user_key}'"
        response = agent.chat(message)
        return response
    except Exception as e:
        return f"Error: {str(e)}"

# Create Gradio interface
with gr.Blocks() as demo:
    gr.Markdown("# XDB Memory & Reminder Assistant")
    
    with gr.Tab("Chat"):
        chatbot = gr.ChatInterface(
            fn=chat_with_agent,
            title="Chat with XDB Assistant",
            examples=[
                "List all memories for user alice",
                "Create a memory about learning Python for user bob",
                "Remind user sarah to submit report by Friday",
                "List all reminders for user john"
            ]
        )
    
    with gr.Tab("Upload Transcript"):
        with gr.Row():
            file_input = gr.File(label="Transcript File")
            user_key_input = gr.Textbox(label="User Key")
            tag_input = gr.Textbox(label="Tag", value="transcript")
        
        process_btn = gr.Button("Process Transcript")
        output = gr.Textbox(label="Result")
        
        process_btn.click(
            process_transcript_file,
            inputs=[file_input, user_key_input, tag_input],
            outputs=output
        )

if __name__ == "__main__":
    demo.launch()
```