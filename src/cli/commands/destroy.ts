import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ConfigManager } from '../../core/config';
import { getProvider } from '../../providers';

export async function destroyCommand(sandboxId: string): Promise<void> {
  console.log(chalk.blue(`🗑️  Destroying sandbox ${sandboxId}...`));
  
  const configManager = new ConfigManager();
  
  try {
    // Check if this is the current sandbox
    const currentSandboxId = await configManager.getCurrentSandbox();
    const isCurrentSandbox = currentSandboxId === sandboxId;
    
    // Get sandbox metadata for better confirmation message
    const sandboxMetadata = await configManager.getSandboxMetadata(sandboxId);
    
    // Enhanced confirmation message
    let confirmMessage = `Are you sure you want to destroy sandbox ${sandboxId}?`;
    if (sandboxMetadata) {
      confirmMessage = `Are you sure you want to destroy sandbox "${sandboxMetadata.name}" (${sandboxId})?`;
    }
    if (isCurrentSandbox) {
      confirmMessage += chalk.yellow('\n⚠️  This is your currently selected sandbox!');
    }
    
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: confirmMessage,
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
    
    spinner.text = 'Cleaning up local metadata...';
    
    // Clean up local metadata
    await configManager.removeSandboxMetadata(sandboxId);
    
    // Clear current sandbox selection if this was the current one
    if (isCurrentSandbox) {
      await configManager.clearCurrentSandbox();
    }
    
    spinner.succeed('Sandbox destroyed successfully!');
    console.log(chalk.green(`✅ Sandbox ${sandboxId} has been destroyed from ${foundProvider}`));
    
    if (isCurrentSandbox) {
      console.log(chalk.yellow('⚠️  Current sandbox selection cleared.'));
      console.log(chalk.gray('💡 Select a new current sandbox with: ') + chalk.white('select'));
    }
    
    // Show remaining sandboxes count
    const remainingSandboxes = await configManager.listSandboxMetadata();
    if (remainingSandboxes.length > 0) {
      console.log(chalk.cyan(`\n📊 You have ${remainingSandboxes.length} sandbox${remainingSandboxes.length > 1 ? 'es' : ''} remaining`));
      console.log(chalk.gray('💡 View them with: ') + chalk.white('list'));
    } else {
      console.log(chalk.gray('\n💡 Create a new sandbox with: ') + chalk.white('create <folder>'));
    }
    
  } catch (error) {
    console.error(chalk.red('Failed to destroy sandbox:'), error);
    process.exit(1);
  }
}