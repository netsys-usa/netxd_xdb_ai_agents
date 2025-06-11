"""
Main XDB AI Agent implementation
"""

import os
from typing import List, Optional
from datetime import datetime

from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import BaseTool
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain.callbacks import StreamingStdOutCallbackHandler

from core.config import XDBConfig
from core.client import XDBAPIClient
from tools.factory import XDBToolFactory

class XDBAIAgent:
    """XDB AI Connector LangChain Agent"""
    
    def __init__(self, 
                 config: XDBConfig, 
                 openai_api_key: str = None,
                 model: str = "gpt-4o",
                 temperature: float = 0.1,
                 streaming: bool = True,
                 verbose: bool = True):
        """
        Initialize XDB AI Agent
        
        Args:
            config: XDB configuration
            openai_api_key: OpenAI API key
            model: OpenAI model to use
            temperature: Model temperature
            streaming: Enable streaming responses
            verbose: Enable verbose logging
        """
        self.config = config
        self.xdb_client = XDBAPIClient(config)
        self.verbose = verbose
        
        # Initialize LLM
        callbacks = [StreamingStdOutCallbackHandler()] if streaming else []
        self.llm = ChatOpenAI(
            model=model,
            temperature=temperature,
            api_key=openai_api_key or os.getenv("OPENAI_API_KEY"),
            streaming=streaming,
            callbacks=callbacks
        )
        
        # Create tools
        tool_factory = XDBToolFactory(self.xdb_client)
        self.tools = tool_factory.create_all_tools()
        
        # Setup memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Create agent
        self.agent = self._create_agent()
    
    def _create_agent(self) -> AgentExecutor:
        """Create the LangChain agent with XDB tools"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an intelligent memory management assistant powered by XDB AI Connector.            
                You can help users with:
                **Memory Management:**
                - List memories for any user (with optional filtering by tokens or search queries)
                - List memories, understand the user query, extract search query and populate query and DO NOT suugest, just extract and execute the query.
                - Understand user query and extract search query, the query can be just a verb or noun, unless user asks to list all his memories, always extract key verbs or nouns rfor search.
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
                - Provide suggestions for better memory organization

                Current time: {current_time}
                XDB Base URL: {base_url}"""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=self.verbose,
            handle_parsing_errors=True,
            max_iterations=5
        )
    
    def chat(self, message: str) -> str:
        """Main interface to chat with the XDB AI agent"""
        try:
            response = self.agent.invoke({
                "input": message,
                "current_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "base_url": self.config.base_url
            })
            return response["output"]
        except Exception as e:
            return f"Sorry, I encountered an error: {str(e)}"
    
    def reset_memory(self):
        """Reset conversation memory"""
        self.memory.clear()
    
    def add_custom_tool(self, tool: BaseTool):
        """Add a custom tool to the agent"""
        self.tools.append(tool)
        # Recreate agent with updated tools
        self.agent = self._create_agent()

# Factory functions for backward compatibility
def create_xdb_agent_from_env(
    openai_api_key: str = None,
    model: str = "gpt-4o",
    **kwargs
) -> XDBAIAgent:
    """Create XDB agent from environment variables"""
    config = XDBConfig.from_env()
    return XDBAIAgent(config, openai_api_key, model, **kwargs)

def create_xdb_agent_from_config(
    config_path: str,
    openai_api_key: str = None,
    model: str = "gpt-3.5-turbo",
    **kwargs
) -> XDBAIAgent:
    """Create XDB agent from configuration file"""
    config = XDBConfig.from_file(config_path)
    return XDBAIAgent(config, openai_api_key, model, **kwargs)

def create_xdb_agent(
    base_url: str,
    api_key: str,
    private_key_path: str = None,
    private_key_content: str = None,
    openai_api_key: str = None,
    model: str = "gpt-3.5-turbo",
    **kwargs
) -> XDBAIAgent:
    """Create XDB agent with explicit configuration"""
    config = XDBConfig(
        base_url=base_url,
        api_key=api_key,
        private_key_path=private_key_path,
        private_key_content=private_key_content
    )
    return XDBAIAgent(config, openai_api_key, model, **kwargs)