import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigManager } from '../../core/config';
import { getProvider } from '../../providers';

const execAsync = promisify(exec);

export async function browseCommand(sandboxId: string): Promise<void> {
  console.log(chalk.blue(`🌐 Opening sandbox ${sandboxId} in browser...`));
  
  const configManager = new ConfigManager();
  
  try {
    const config = await configManager.loadConfig();
    const providerNames = Object.keys(config.providers);
    
    if (providerNames.length === 0) {
      console.log(chalk.yellow('No providers configured. Run "sandbox-cli configure <provider>"'));
      return;
    }
    
    let url: string | undefined;
    let foundProvider: string | undefined;
    
    // Try to find the sandbox across all providers
    for (const providerName of providerNames) {
      try {
        const provider = getProvider(providerName);
        
        if (!await provider.isConfigured()) {
          continue;
        }
        
        const instanceUrl = await provider.getInstanceUrl(sandboxId);
        if (instanceUrl) {
          url = instanceUrl;
          foundProvider = providerName;
          break;
        }
      } catch (error) {
        // Continue to next provider if this one fails
        continue;
      }
    }
    
    if (!url) {
      throw new Error(`Sandbox ${sandboxId} not found in any configured provider`);
    }
    
    console.log(chalk.gray(`Found sandbox in ${foundProvider} provider`));
    console.log(chalk.gray(`Opening: ${url}`));
    
    // Open URL in default browser
    const platform = process.platform;
    let command: string;
    
    switch (platform) {
      case 'darwin':
        command = `open "${url}"`;
        break;
      case 'win32':
        command = `start "${url}"`;
        break;
      default:
        command = `xdg-open "${url}"`;
    }
    
    await execAsync(command);
    console.log(chalk.green('✅ Opened in browser'));
    
  } catch (error) {
    console.error(chalk.red('Failed to open browser:'), error);
    process.exit(1);
  }
}