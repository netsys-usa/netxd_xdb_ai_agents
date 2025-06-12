export class XDBAgentManager {
    private agents: Map<string, XDBAIAgent> = new Map();
  
    addAgent(name: string, agent: XDBAIAgent): void {
      this.agents.set(name, agent);
    }
  
    getAgent(name: string): XDBAIAgent | undefined {
      return this.agents.get(name);
    }
  
    removeAgent(name: string): void {
      this.agents.delete(name);
    }
  
    listAgents(): string[] {
      return Array.from(this.agents.keys());
    }
  
    async chatWithAgent(agentName: string, message: string): Promise<string> {
      const agent = this.getAgent(agentName);
      if (agent) {
        return agent.chat(message);
      }
      return `Agent '${agentName}' not found`;
    }
  }
  
  // Factory functions
  export function createXDBAgentFromEnv(
    openaiApiKey?: string,
    model: string = 'gpt-4',
    options: Partial<XDBAIAgentOptions> = {}
  ): XDBAIAgent {
    const config = XDBConfigManager.fromEnv();
    return new XDBAIAgent({
      config,
      openaiApiKey,
      model,
      ...options
    });
  }
  
  export function createXDBAgentFromConfig(
    configPath: string,
    openaiApiKey?: string,
    model: string = 'gpt-3.5-turbo',
    options: Partial<XDBAIAgentOptions> = {}
  ): XDBAIAgent {
    const config = XDBConfigManager.fromFile(configPath);
    return new XDBAIAgent({
      config,
      openaiApiKey,
      model,
      ...options
    });
  }
  
  export function createXDBAgent(
    baseUrl: string,
    apiKey: string,
    privateKeyPath?: string,
    privateKeyContent?: string,
    openaiApiKey?: string,
    model: string = 'gpt-3.5-turbo',
    options: Partial<XDBAIAgentOptions> = {}
  ): XDBAIAgent {
    const config: XDBConfig = {
      baseUrl,
      apiKey,
      privateKeyPath,
      privateKeyContent
    };
    return new XDBAIAgent({
      config,
      openaiApiKey,
      model,
      ...options
    });
  }