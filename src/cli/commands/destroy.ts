import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ConfigManager } from '../../core/config';
import { getProvider } from '../../providers';

export async function destroyCommand(sandboxId: string): Promise<void> {
  console.log(chalk.blue(`🗑️  Destroying sandbox ${sandboxId}...`));
  
  const configManager = new ConfigManager();
  
  try {
    // Confirm destruction
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Are you sure you want to destroy sandbox ${sandboxId}?`,
        default: false
      }
    ]);
    
    if (!confirmed) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }
    
    const config = await configManager.loadConfig();
    const providerNames = Object.keys(config.providers);
    
    if (providerNames.length === 0) {
      console.log(chalk.yellow('No providers configured. Run "sandbox-cli configure <provider>"'));
      return;
    }
    
    const spinner = ora('Destroying sandbox...').start();
    
    let destroyed = false;
    let foundProvider: string | undefined;
    
    // Try to find and destroy the sandbox across all providers
    for (const providerName of providerNames) {
      try {
        const provider = getProvider(providerName);
        
        if (!await provider.isConfigured()) {
          continue;
        }
        
        // Try to destroy the sandbox
        await provider.destroy(sandboxId);
        destroyed = true;
        foundProvider = providerName;
        break;
        
      } catch (error) {
        // Continue to next provider if this one fails
        continue;
      }
    }
    
    if (!destroyed) {
      spinner.fail('Sandbox not found');
      throw new Error(`Sandbox ${sandboxId} not found in any configured provider`);
    }
    
    spinner.succeed('Sandbox destroyed successfully!');
    console.log(chalk.green(`✅ Sandbox ${sandboxId} has been destroyed from ${foundProvider}`));
    
  } catch (error) {
    console.error(chalk.red('Failed to destroy sandbox:'), error);
    process.exit(1);
  }
}