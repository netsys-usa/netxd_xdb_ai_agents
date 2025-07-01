"""
Tool factory for creating LangChain tools from XDB API client
"""

from typing import List
from langchain.tools import StructuredTool
from Crypto.PublicKey import RSA

from core.client import XDBAPIClient
from core.models import ListMemoriesInput, CreateMemoryInput, ProcessTranscriptInput, CreateReminderInput
from utils.rsa_encryption_service import RSAEncryption

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
                    
                    private_key = """"""
                    
                    rsaEncryption = RSAEncryption()
                    rsaEncryption.private_key = RSA.import_key(private_key)  

                    print("Decrypting memories..., Private Key loaded")  

                    formatted_memories = []
                    for i, memory in enumerate(memories, 1):
                        memoryDecrypted = memory.get('memory', 'N/A')
                        tokensDecrypted = []
                        isEncrypted = memory.get('isEncrypted', False)
                        if isEncrypted:
                            memoryEnc = bytes.fromhex(memoryDecrypted)
                            memoryDecrypted = rsaEncryption.rsa_decrypt_oaep(memoryEnc).decode('utf-8')

                            for token in memory.get('tokens', []):
                                tokenEnc = bytes.fromhex(token)
                                tokenDecrypted = rsaEncryption.rsa_decrypt_oaep(tokenEnc).decode('utf-8')
                                tokensDecrypted.append(tokenDecrypted)
                        else:
                            memoryDecrypted = memoryDecrypted    
                            tokensDecrypted = memory.get('tokens', [])

                        formatted_memory = f"""Memory {i}:
                            - Content: {memoryDecrypted}
                            - Date: {memory.get('date', 'N/A')}
                            - Transaction: {memory.get('transactionNumber', 'N/A')}
                            - Tokens: {', '.join(tokensDecrypted)}
                            - Language: {memory.get('language') or 'Not specified'}
                            - Encrypted: {memory.get('isEncrypted')} """
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

    def create_list_reminders_tool(self) -> StructuredTool:
        """Create tool for listing reminders"""
        def list_reminders_tool(user_key: str, tokens: List[str] = None, query: str = "") -> str:
            try:
                result = self.xdb_client.list_reminders(user_key, tokens, query)
                
                if result.status == "Success":
                    reminders = result.data.get("reminders", []) if result.data else []
                    if not reminders:
                        return "No memories found for this user."
                    
                    formatted_reminders = []
                    for i, reminder in enumerate(reminders, 1):
                        formatted_memory = f"""Reminder {i}:
                            - Content: {reminder.get('reminder', 'N/A')}
                            - Event Date: {reminder.get('eventDate', 'N/A')}
                            - Event: {reminder.get('event', 'N/A')}"""
                        formatted_reminders.append(formatted_memory)
                    
                    return f"Found {len(reminders)} reminders:\n\n" + "\n\n".join(formatted_reminders)
                else:
                    return f"Error: {result.message}"
                    
            except Exception as e:
                return f"Error listing memories: {str(e)}"
        
        return StructuredTool.from_function(
            func=list_reminders_tool,
            name="list_reminders",
            description="List all reminders for a user. You can optionally filter by tokens or search with a query string.",
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
    
    def create_create_reminder_tool(self) -> StructuredTool:
        """Create tool for creating memories"""
        def create_reminder_tool(user_key: str, content: str, tag: str = "", session_id: str = "") -> str:
            try:
                result = self.xdb_client.create_reminder(user_key, content, tag, session_id)
                
                if result.status == "Success":
                    return f"Memory created successfully!\nMessage: {result.message}\nProcess ID: {result.process_id or 'N/A'}"
                else:
                    return f"Failed to create memory: {result.message}"
                    
            except Exception as e:
                return f"Error creating memory: {str(e)}"
        
        return StructuredTool.from_function(
            func=create_reminder_tool,
            name="create_reminder",
            description="Create a new reminder for a user. Requires user key and content. Optional tag and session ID can be provided.",
            args_schema=CreateReminderInput
        )

    def create_process_transcript_text_tool(self) -> StructuredTool:
        """Create tool for processing transcript text"""
        def process_transcript_text_tool(user_key:str, path: str, tag:str) -> str:
            try:
                result = self.xdb_client.process_transcript_text(user_key, path, tag)

                if result.status == "Success":
                    return f"Transcript text processed successfully!\nMessage: {result.message}\nProcess ID: {result.process_id or 'N/A'}"
                else:
                    return f"Failed to process transcript text: {result.message}"
            except Exception as e:
                return f"Error processing transcript text: {str(e)}"

        return StructuredTool.from_function(
            func=process_transcript_text_tool,
            name="process_transcript_text",
            description="Process transcript text for a user. Requires user key and content.",
            args_schema=ProcessTranscriptInput
        )    
    
    def create_all_tools(self) -> List[StructuredTool]:
        """Create all available XDB tools"""
        return [
            self.create_list_memories_tool(),
            self.create_create_memory_tool(),
            self.create_process_transcript_text_tool(),
            self.create_create_reminder_tool(),
            self.create_list_reminders_tool()
        ]