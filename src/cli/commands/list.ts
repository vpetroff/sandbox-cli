import chalk from 'chalk';
import { ConfigManager } from '../../core/config';
import { getProvider } from '../../providers';

export async function listCommand(): Promise<void> {
  console.log(chalk.blue('📋 Listing active sandboxes...'));
  
  const configManager = new ConfigManager();
  
  try {
    const config = await configManager.loadConfig();
    const providerNames = Object.keys(config.providers);
    
    if (providerNames.length === 0) {
      console.log(chalk.yellow('No providers configured. Run "sandbox-cli configure <provider>"'));
      return;
    }
    
    let totalSandboxes = 0;
    
    for (const providerName of providerNames) {
      try {
        const provider = getProvider(providerName);
        
        if (!await provider.isConfigured()) {
          console.log(chalk.yellow(`⚠️  Provider ${providerName} not configured`));
          continue;
        }
        
        const instances = await provider.list();
        
        if (instances.length > 0) {
          console.log(chalk.green(`\n${providerName.toUpperCase()} Sandboxes:`));
          
          instances.forEach(instance => {
            const statusColor = instance.status === 'running' ? chalk.green : 
                               instance.status === 'error' ? chalk.red : 
                               chalk.yellow;
            
            console.log(`  ${chalk.cyan(instance.id)} - ${instance.name}`);
            console.log(`    Status: ${statusColor(instance.status)}`);
            console.log(`    Created: ${instance.createdAt.toLocaleDateString()}`);
            if (instance.url) {
              console.log(`    URL: ${chalk.blue(instance.url)}`);
            }
            console.log('');
          });
          
          totalSandboxes += instances.length;
        }
        
      } catch (error) {
        console.log(chalk.red(`❌ Error listing ${providerName} sandboxes: ${error}`));
      }
    }
    
    if (totalSandboxes === 0) {
      console.log(chalk.gray('No active sandboxes found'));
    } else {
      console.log(chalk.green(`\nTotal: ${totalSandboxes} sandbox${totalSandboxes > 1 ? 'es' : ''}`));
    }
    
  } catch (error) {
    console.error(chalk.red('Failed to list sandboxes:'), error);
    process.exit(1);
  }
}