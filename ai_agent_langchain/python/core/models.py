"""
Data models for XDB AI Connector Library
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class MemoryRecord(BaseModel):
    """Represents a memory record from XDB"""
    memory: str
    date: str
    transaction_number: str
    tokens: List[str] = []
    language: Optional[str] = None
    tag: Optional[str] = None
    session_id: Optional[str] = None

class XDBResponse(BaseModel):
    """Standard XDB API response"""
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
    error: bool = False
    process_id: Optional[str] = None

class ListMemoriesInput(BaseModel):
    """Input schema for listing memories"""
    user_key: str = Field(description="The user key to list memories for")
    tokens: Optional[List[str]] = Field(default=None, description="Optional list of tokens to filter memories")
    query: Optional[str] = Field(default="", description="Optional query string to search memories")

class CreateMemoryInput(BaseModel):
    """Input schema for creating memories"""
    user_key: str = Field(description="The user key to create memory for")
    content: str = Field(description="The transcript file path")
    tag: Optional[str] = Field(default="", description="Optional tag for categorizing the memory")
    session_id: Optional[str] = Field(default="", description="Optional session ID for grouping memories")


class ProcessTranscriptInput(BaseModel):
    """Input schema for creating memories"""
    user_key: str = Field(description="The user key to create memory for")
    path: str = Field(description="The content/text of the transcript to process")
    tag: str = Field(description="Need to provide a tag for the transcripts")
    session_id: Optional[str] = Field(default="", description="Optional session ID for grouping memories")