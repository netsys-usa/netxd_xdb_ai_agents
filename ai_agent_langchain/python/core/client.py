"""
XDB API Client for XDB AI Connector Library
"""

import os
import json
import base64
import requests
from typing import List, Optional
from datetime import datetime

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import load_pem_private_key

from core.config import XDBConfig
from core.models import XDBResponse
from utils.exceptions import XDBAPIError, XDBAuthenticationError
from utils.file_types import file_type_service

class XDBAPIClient:
    """Client for XDB AI Connector API with cryptographic authentication"""
    
    def __init__(self, config: XDBConfig):
        self.config = config
        self.config.validate()
        self.session = requests.Session()
        self.private_key = self._load_private_key()
        
        # Set default headers
        self.session.headers.update({
            "Content-Type": "application/json",
            "apikey": self.config.api_key
        })
    
    def _load_private_key(self):
        """Load private key from file or content"""
        try:
            if self.config.private_key_path and os.path.exists(self.config.private_key_path):
                with open(self.config.private_key_path, "rb") as key_file:
                    return load_pem_private_key(
                        key_file.read(),
                        password=None,
                        backend=default_backend()
                    )
            elif self.config.private_key_content:
                return serialization.load_pem_private_key(
                    self.config.private_key_content.encode(),
                    password=None
                )
            else:
                print("Warning: No private key provided. Requests will not be signed.")
                return None
        except Exception as e:
            print(f"Warning: Could not load private key: {e}")
            return None
    
    def _create_signature(self, payload: str) -> str:
        """Create ECDSA signature for the payload"""
        if not self.private_key:
            return ""
        
        try:
            signature = self.private_key.sign(
                payload.encode('utf-8'),
                ec.ECDSA(hashes.SHA256())
            )
            return base64.b64encode(signature).decode('utf-8')
        except Exception as e:
            print(f"Error creating signature: {e}")
            return ""
    
    def _make_request(self, endpoint: str, data: dict) -> XDBResponse:
        """Make authenticated request to XDB API"""
        url = f"{self.config.base_url}{endpoint}"
        payload = json.dumps(data)
        
        headers = dict(self.session.headers)
        
        # Add signature if we have a private key
        if self.private_key:
            signature = self._create_signature(payload)
            if signature:
                headers["signature"] = signature
        
        try:
            response = self.session.post(url, data=payload, headers=headers)
            response.raise_for_status()
            response_data = response.json()
            return XDBResponse(**response_data)
        except requests.RequestException as e:
            raise XDBAPIError(f"Request failed: {str(e)}")
    
    def list_memories(self, user_key: str, tokens: List[str] = None, query: str = "") -> XDBResponse:
        """List memories for a user"""
        data = {
            "userKey": user_key,
            "tokens": tokens or [],
            "query": query
        }
        return self._make_request("/api/memory/list", data)
    
    def create_memory(self, user_key: str, content: str, tag: str = "", session_id: str = "") -> XDBResponse:
        """Create a new memory"""
        data = {
            "userKey": user_key,
            "content": content,
            "tag": tag,
            "sessionId": session_id or datetime.now().strftime("%Y%m%d%H")
        }
        return self._make_request("/api/memory/create", data)
    
    def create_reminder(self, user_key: str, content: str, tag: str = "", session_id: str = "") -> XDBResponse:
        """Create a new reminder"""
        data = {
            "userKey": user_key,
            "content": content,
            "tag": tag,
            "sessionId": session_id or datetime.now().strftime("%Y%m%d%H")
        }
        return self._make_request("/api/reminder/create", data)
    
    
    def process_transcript_text(self, user_key: str, path: str, tag:str) -> XDBResponse:
        """Process a new transcript"""
        try:
            # Check the file type
            isJson =  file_type_service.is_json_file(path)
            if isJson:
                content = ''
                isZoomFormat = file_type_service.detect_zoom_transcript_format(path)
                if isZoomFormat != "UNKNOWN":
                    print("Zoom format detected")
                    with open(path, 'r', encoding='utf-8') as file:
                        transcriptJson = json.load(file)
                        for segment in transcriptJson["transcript"]["transcript_content"]:
                            sentence = segment['text']
                            speaker_name = segment['speaker_name']
                            content += f"{speaker_name}: {sentence} "
                        print(content)
                else:                
                    with open(path, 'r', encoding='utf-8') as file:
                        transcriptJson = json.load(file)
                        for segment in transcriptJson:
                            sentence = segment['sentence']
                            speaker_name = segment['speaker_name']
                            duration = f"{segment['startTime']}-{segment['endTime']}"
                            content += f"{speaker_name}[{duration}]: {sentence} "
                        print(content)
            else:
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    print(content)

        except FileNotFoundError:
            print("File not found!")
        except IOError:
            print("Error reading file!")

        metadata = {
            "source":"MANUAL",
            "type":"SUMMARY",
            "tag":tag,
            "message":content
        }    

        data = {
            "userKey": user_key,
            "metadata": metadata
        }
        return self._make_request("/api/extraction/process-summary", data)
    
    def health_check(self) -> XDBResponse:
        """Check API health"""
        return self._make_request("/api/health", {})