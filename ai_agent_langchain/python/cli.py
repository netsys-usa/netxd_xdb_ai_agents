"""
Command line interface for XDB AI Connector
"""

import argparse
import asyncio
import sys
from agent.agent import create_xdb_agent_from_env

def interactive_mode():
    """Run in interactive mode"""
    try:
        agent = create_xdb_agent_from_env(verbose=False)
        print("XDB Memory Bot started! Type 'exit' to quit.\n")
        
        while True:
            try:
                user_input = input("You: ")
                if user_input.lower() in ['exit', 'quit', 'q']:
                    break
                    
                response = agent.chat(user_input)
                print(f"Bot: {response}\n")
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error: {e}\n")
        
        print("Goodbye!")
    except Exception as e:
        print(f"Failed to start agent: {e}")
        sys.exit(1)

def single_command(message: str):
    """Execute a single command"""
    try:
        agent = create_xdb_agent_from_env(verbose=False)
        response = agent.chat(message)
        print(response)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="XDB AI Connector CLI")
    parser.add_argument(
        "--interactive", "-i", 
        action="store_true", 
        help="Run in interactive mode"
    )
    parser.add_argument(
        "--message", "-m", 
        type=str, 
        help="Single message to send to the agent"
    )
    parser.add_argument(
        "--version", "-v", 
        action="store_true", 
        help="Show version information"
    )
    
    args = parser.parse_args()
    
    if args.version:
        from . import __version__
        print(f"XDB AI Connector v{__version__}")
        return
    
    if args.interactive:
        interactive_mode()
    elif args.message:
        single_command(args.message)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()