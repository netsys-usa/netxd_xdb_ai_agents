"""
Configuration management for XDB AI Connector Library
"""

import os
import json
from dataclasses import dataclass
from typing import Optional
from utils.exceptions import XDBValidationError

@dataclass
class XDBConfig:
    """Configuration for XDB AI Connector"""
    base_url: str
    api_key: str
    private_key_path: Optional[str] = None
    private_key_content: Optional[str] = None
    
    @classmethod
    def from_env(cls) -> 'XDBConfig':
        """Load configuration from environment variables"""
        return cls(
            base_url=os.getenv("XDB_BASE_URL", "http://localhost:5000"),
            api_key=os.getenv("XDB_API_KEY", ""),
            private_key_path=os.getenv("XDB_PRIVATE_KEY_PATH"),
            private_key_content=os.getenv("XDB_PRIVATE_KEY_CONTENT")
        )
    
    @classmethod
    def from_file(cls, config_path: str) -> 'XDBConfig':
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
            return cls(**config_data)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            raise XDBValidationError(f"Failed to load config file: {e}")
    
    def validate(self) -> bool:
        """Validate configuration"""
        if not self.api_key:
            raise XDBValidationError("API key is required")
        if not self.private_key_path and not self.private_key_content:
            raise XDBValidationError("Either private_key_path or private_key_content must be provided")
        return True