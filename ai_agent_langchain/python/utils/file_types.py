import os
import mimetypes
from pathlib import Path

class FileTypes:
    def check_file_type_by_extension(self, filepath):
        """Check file type using file extension"""
        _, extension = os.path.splitext(filepath)
        return extension.lower()
    
    def check_file_type_by_mimetype(self, filepath):
        """Check file type using mimetypes library"""
        mime_type, _ = mimetypes.guess_type(filepath)
        return mime_type
    
    def check_file_type_comprehensive(self, filepath):
        """Comprehensive file type checking"""
        if not os.path.exists(filepath):
            return {"error": "File does not exist"}
        
        file_info = {
            "filepath": filepath,
            "filename": os.path.basename(filepath),
            "extension": self.check_file_type_by_extension(filepath),
            "mime_type": self.check_file_type_by_mimetype(filepath),
            "size_bytes": os.path.getsize(filepath),
            "is_file": os.path.isfile(filepath)
        }
        return file_info
    
    def is_transcript_file(self, filepath):
        """Check if file is a transcript based on extension and content"""
        transcript_extensions = ['.vtt', '.srt', '.txt', '.json']
        transcript_mimes = ['text/vtt', 'application/json', 'text/plain']
        
        extension = self.check_file_type_by_extension(filepath)
        mime_type = self.check_file_type_by_mimetype(filepath)
        
        # Check by extension
        if extension in transcript_extensions:
            return True
        
        # Check by MIME type
        if mime_type in transcript_mimes:
            return True
        
        # Check content for transcript keywords
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read(1000).lower()  # Read first 1000 chars
                transcript_keywords = ['webvtt', 'speaker_name', 'start_time', 'transcript']
                if any(keyword in content for keyword in transcript_keywords):
                    return True
        except:
            pass
        
        return False
    
    def detect_zoom_transcript_format(self, filepath):
        """Detect specific Zoom transcript format"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read(500)
                
            # Check for VTT format
            if content.startswith('WEBVTT'):
                return "VTT"
            
            # Check for JSON format with Zoom structure
            if ('"speaker_name"' in content and 
                '"start_time"' in content and 
                '"end_time"' in content):
                return "JSON"
            
            return "UNKNOWN"
        except Exception as e:
            return f"Error reading file: {e}"
        
    def is_video_file(self, filepath):
        """Check if file is a video"""
        video_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv']
        return self.check_file_type_by_extension(filepath) in video_extensions

    def is_audio_file(self, filepath):
        """Check if file is an audio file"""
        audio_extensions = ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg']
        return self.check_file_type_by_extension(filepath) in audio_extensions

    def is_json_file(self, filepath):
        """Check if file is JSON"""
        return self.check_file_type_by_extension(filepath) == '.json'

    def validate_file_content(self, filepath):
        """Validate file content matches extension"""
        extension = self.check_file_type_by_extension(filepath)
        
        if extension == '.json':
            try:
                import json
                with open(filepath, 'r') as f:
                    json.load(f)
                return True, "Valid JSON"
            except json.JSONDecodeError:
                return False, "Invalid JSON content"
        
        elif extension == '.vtt':
            try:
                with open(filepath, 'r') as f:
                    first_line = f.readline().strip()
                    if first_line == 'WEBVTT':
                        return True, "Valid VTT file"
                    else:
                        return False, "Missing WEBVTT header"
            except:
                return False, "Cannot read VTT file"
        
        return True, "Content validation not implemented for this type"    
    

file_type_service = FileTypes()