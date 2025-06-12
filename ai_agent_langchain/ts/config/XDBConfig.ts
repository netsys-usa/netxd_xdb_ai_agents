import { readFileSync } from 'fs';
import { XDBConfig } from '../types';
import {XDBValidationError, XDBConfigurationError} from '../exceptions'

export class XDBConfigManager {
  static fromEnv(): XDBConfig {
    return {
      baseUrl: process.env.XDB_BASE_URL || 'http://localhost:5000',
      apiKey: process.env.XDB_API_KEY || '',
      privateKeyPath: process.env.XDB_PRIVATE_KEY_PATH,
      privateKeyContent: process.env.XDB_PRIVATE_KEY_CONTENT
    };
  }

  static fromFile(configPath: string): XDBConfig {
    try {
      const configData = readFileSync(configPath, 'utf8');
      return JSON.parse(configData) as XDBConfig;
    } catch (error) {
      throw new XDBValidationError(`Failed to load config file: ${error}`);
    }
  }

  static validate(config: XDBConfig): boolean {
    if (!config.apiKey) {
      throw new XDBValidationError('API key is required');
    }
    if (!config.privateKeyPath && !config.privateKeyContent) {
      throw new XDBValidationError('Either privateKeyPath or privateKeyContent must be provided');
    }
    return true;
  }
}