export class XDBError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'XDBError';
    }
  }
  
  export class XDBAuthenticationError extends XDBError {
    constructor(message: string) {
      super(message);
      this.name = 'XDBAuthenticationError';
    }
  }
  
  export class XDBValidationError extends XDBError {
    constructor(message: string) {
      super(message);
      this.name = 'XDBValidationError';
    }
  }
  
  export class XDBAPIError extends XDBError {
    constructor(message: string) {
      super(message);
      this.name = 'XDBAPIError';
    }
  }
  
  export class XDBConfigurationError extends XDBError {
    constructor(message: string) {
      super(message);
      this.name = 'XDBConfigurationError';
    }
  }