import { createSign } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { XDBConfig, XDBResponse } from '../types';
import { XDBAPIError, XDBAuthenticationError } from '../exceptions'
import { XDBConfigManager } from '../config'

export class XDBAPIClient {
  private config: XDBConfig;
  private httpClient: AxiosInstance;
  private privateKey?: string;

  constructor(config: XDBConfig) {
    this.config = config;
    XDBConfigManager.validate(config);
    
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey
      }
    });

    this.privateKey = this.loadPrivateKey();
  }

  private loadPrivateKey(): string | undefined {
    try {
      if (this.config.privateKeyPath && existsSync(this.config.privateKeyPath)) {
        return readFileSync(this.config.privateKeyPath, 'utf8');
      } else if (this.config.privateKeyContent) {
        return this.config.privateKeyContent;
      } else {
        console.warn('Warning: No private key provided. Requests will not be signed.');
        return undefined;
      }
    } catch (error) {
      console.warn(`Warning: Could not load private key: ${error}`);
      return undefined;
    }
  }

  private createSignature(payload: string): string {
    if (!this.privateKey) {
      return '';
    }

    try {
      const sign = createSign('SHA256');
      sign.update(payload);
      sign.end();
      return sign.sign(this.privateKey, 'base64');
    } catch (error) {
      console.error(`Error creating signature: ${error}`);
      return '';
    }
  }

  private async makeRequest(endpoint: string, data: Record<string, any>): Promise<XDBResponse> {
    const payload = JSON.stringify(data);
    const headers: Record<string, string> = {
      ...this.httpClient.defaults.headers.common
    };

    if (this.privateKey) {
      const signature = this.createSignature(payload);
      if (signature) {
        headers['signature'] = signature;
      }
    }

    try {
      const response: AxiosResponse = await this.httpClient.post(endpoint, data, { headers });
      return response.data as XDBResponse;
    } catch (error) {
      throw new XDBAPIError(`Request failed: ${error}`);
    }
  }

  async listMemories(userKey: string, tokens?: string[], query: string = ''): Promise<XDBResponse> {
    const data = {
      userKey,
      tokens: tokens || [],
      query
    };
    return this.makeRequest('/api/memory/list', data);
  }

  async createMemory(userKey: string, content: string, tag: string = '', sessionId?: string): Promise<XDBResponse> {
    const data = {
      userKey,
      content,
      tag,
      sessionId: sessionId || new Date().toISOString().slice(0, 10).replace(/-/g, '') + new Date().getHours().toString().padStart(2, '0')
    };
    return this.makeRequest('/api/memory/create', data);
  }

  async healthCheck(): Promise<XDBResponse> {
    return this.makeRequest('/api/health', {});
  }
}