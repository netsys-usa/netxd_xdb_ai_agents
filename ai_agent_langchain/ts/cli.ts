import { Command } from 'commander';
import * as readline from 'readline';

const program = new Command();

function createWeatherTool(): Tool {
  return {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'Location to get weather for' }
      },
      required: ['location']
    },
    execute: async (params: { location: string }): Promise<string> => {
      return `Weather in ${params.location}: Sunny, 75°F`;
    }
  };
}

async function interactiveMode(): Promise<void> {
  try {
    const agent = createXDBAgentFromEnv(undefined, 'gpt-4', { verbose: false });
    console.log('XDB Memory Bot started! Type "exit" to quit.\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (query: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(query, resolve);
      });
    };

    while (true) {
      try {
        const userInput = await askQuestion('\n\nYou: ');
        
        if (['exit', 'quit', 'q'].includes(userInput.toLowerCase())) {
          break;
        }

        const response = await agent.chat(userInput);
        console.log(`\n\nBot: ${response}\n`);
        agent.resetMemory();
      } catch (error) {
        console.log(`Error: ${error}\n`);
      }
    }

    rl.close();
    console.log('Goodbye!');
  } catch (error) {
    console.error(`Failed to start agent: ${error}`);
    process.exit(1);
  }
}

async function interactiveModeWithCustomTool(): Promise<void> {
  try {
    const agent = createXDBAgentFromEnv(undefined, 'gpt-4', { verbose: false });
    agent.addCustomTool(createWeatherTool());
    console.log('XDB Memory Bot started! Type "exit" to quit.\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (query: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(query, resolve);
      });
    };

    while (true) {
      try {
        const userInput = await askQuestion('\n\nYou: ');
        
        if (['exit', 'quit', 'q'].includes(userInput.toLowerCase())) {
          break;
        }

        const response = await agent.chat(userInput);
        console.log(`\n\nBot: ${response}\n`);
        agent.resetMemory();
      } catch (error) {
        console.log(`Error: ${error}\n`);
      }
    }

    rl.close();
    console.log('Goodbye!');
  } catch (error) {
    console.error(`Failed to start agent: ${error}`);
    process.exit(1);
  }
}

async function singleCommand(message: string): Promise<void> {
  try {
    const agent = createXDBAgentFromEnv(undefined, 'gpt-4', { verbose: false });
    const response = await agent.chat(message);
    console.log(response);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

// CLI Setup
program
  .name('xdb-ai-agent')
  .description('XDB AI Connector CLI')
  .version('1.0.0');

program
  .option('-i, --interactive', 'Run in interactive mode')
  .option('-ic, --interactive-custom', 'Run in custom interactive mode')
  .option('-m, --message <message>', 'Single message to send to the agent')
  .action(async (options) => {
    if (options.interactive) {
      await interactiveMode();
    } else if (options.interactiveCustom) {
      await interactiveModeWithCustomTool();
    } else if (options.message) {
      await singleCommand(options.message);
    } else {
      program.help();
    }
  });

if (require.main === module) {
  program.parse();
}

export { program };type