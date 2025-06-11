"""
Tool factory for creating LangChain tools from XDB API client
"""

from typing import List
from langchain.tools import StructuredTool

from core.client import XDBAPIClient
from core.models import ListMemoriesInput, CreateMemoryInput

class XDBToolFactory:
    """Factory for creating LangChain tools from XDB API client"""
    
    def __init__(self, xdb_client: XDBAPIClient):
        self.xdb_client = xdb_client
    
    def create_list_memories_tool(self) -> StructuredTool:
        """Create tool for listing memories"""
        def list_memories_tool(user_key: str, tokens: List[str] = None, query: str = "") -> str:
            try:
                result = self.xdb_client.list_memories(user_key, tokens, query)
                
                if result.status == "Success":
                    memories = result.data.get("memories", []) if result.data else []
                    if not memories:
                        return "No memories found for this user."
                    
                    formatted_memories = []
                    for i, memory in enumerate(memories, 1):
                        formatted_memory = f"""Memory {i}:
                            - Content: {memory.get('memory', 'N/A')}
                            - Date: {memory.get('date', 'N/A')}
                            - Transaction: {memory.get('transactionNumber', 'N/A')}
                            - Tokens: {', '.join(memory.get('tokens', []))}
                            - Language: {memory.get('language') or 'Not specified'}"""
                        formatted_memories.append(formatted_memory)
                    
                    return f"Found {len(memories)} memories:\n\n" + "\n\n".join(formatted_memories)
                else:
                    return f"Error: {result.message}"
                    
            except Exception as e:
                return f"Error listing memories: {str(e)}"
        
        return StructuredTool.from_function(
            func=list_memories_tool,
            name="list_memories",
            description="List all memories for a user. You can optionally filter by tokens or search with a query string.",
            args_schema=ListMemoriesInput
        )
    
    def create_create_memory_tool(self) -> StructuredTool:
        """Create tool for creating memories"""
        def create_memory_tool(user_key: str, content: str, tag: str = "", session_id: str = "") -> str:
            try:
                result = self.xdb_client.create_memory(user_key, content, tag, session_id)
                
                if result.status == "Success":
                    return f"Memory created successfully!\nMessage: {result.message}\nProcess ID: {result.process_id or 'N/A'}"
                else:
                    return f"Failed to create memory: {result.message}"
                    
            except Exception as e:
                return f"Error creating memory: {str(e)}"
        
        return StructuredTool.from_function(
            func=create_memory_tool,
            name="create_memory",
            description="Create a new memory for a user. Requires user key and content. Optional tag and session ID can be provided.",
            args_schema=CreateMemoryInput
        )
    
    def create_all_tools(self) -> List[StructuredTool]:
        """Create all available XDB tools"""
        return [
            self.create_list_memories_tool(),
            self.create_create_memory_tool()
        ]