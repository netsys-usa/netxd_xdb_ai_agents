"""
Agent manager for handling multiple XDB AI agents
"""

from typing import Dict, List, Optional
from .agent import XDBAIAgent

class XDBAgentManager:
    """Manager for multiple XDB agents"""
    
    def __init__(self):
        self.agents: Dict[str, XDBAIAgent] = {}
    
    def add_agent(self, name: str, agent: XDBAIAgent):
        """Add an agent to the manager"""
        self.agents[name] = agent
    
    def get_agent(self, name: str) -> Optional[XDBAIAgent]:
        """Get an agent by name"""
        return self.agents.get(name)
    
    def remove_agent(self, name: str):
        """Remove an agent from the manager"""
        self.agents.pop(name, None)
    
    def list_agents(self) -> List[str]:
        """List all agent names"""
        return list(self.agents.keys())
    
    def chat_with_agent(self, agent_name: str, message: str) -> str:
        """Chat with a specific agent"""
        agent = self.get_agent(agent_name)
        if agent:
            return agent.chat(message)
        return f"Agent '{agent_name}' not found"