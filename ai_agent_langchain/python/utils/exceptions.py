"""
Custom exceptions for XDB AI Connector Library
"""

class XDBError(Exception):
    """Base exception for XDB AI Connector"""
    pass

class XDBAuthenticationError(XDBError):
    """Raised when authentication fails"""
    pass

class XDBValidationError(XDBError):
    """Raised when validation fails"""
    pass

class XDBAPIError(XDBError):
    """Raised when API request fails"""
    pass

class XDBConfigurationError(XDBError):
    """Raised when configuration is invalid"""
    pass