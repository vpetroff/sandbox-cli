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
    
    // Get current sandbox for highlighting
    const currentSandboxId = await configManager.getCurrentSandbox();
    
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
          
          for (const instance of instances) {
            const statusColor = instance.status === 'running' || instance.status === 'deployed' ? chalk.green : 
                               instance.status === 'error' ? chalk.red : 
                               chalk.yellow;
            
            const isCurrent = instance.id === currentSandboxId;
            const currentIndicator = isCurrent ? chalk.cyan(' ← CURRENT') : '';
            const nameColor = isCurrent ? chalk.cyan.bold : chalk.cyan;
            
            console.log(`  ${nameColor(instance.id)} - ${instance.name}${currentIndicator}`);
            console.log(`    Status: ${statusColor(instance.status)}`);
            console.log(`    Created: ${instance.createdAt.toLocaleDateString()}`);
            
            // Show additional metadata if available
            const sandboxMetadata = await configManager.getSandboxMetadata(instance.id);
            if (sandboxMetadata) {
              console.log(`    Deployments: ${sandboxMetadata.deploymentCount}`);
              if (sandboxMetadata.lastDeployedAt) {
                console.log(`    Last Deployed: ${new Date(sandboxMetadata.lastDeployedAt).toLocaleDateString()}`);
              }
              if (sandboxMetadata.sourceFolder) {
                console.log(`    Source: ${chalk.gray(sandboxMetadata.sourceFolder)}`);
              }
            }
            
            if (instance.url) {
              console.log(`    URL: ${chalk.blue(instance.url)}`);
            }
            console.log('');
          }
          
          totalSandboxes += instances.length;
        }
        
      } catch (error) {
        console.log(chalk.red(`❌ Error listing ${providerName} sandboxes: ${error}`));
      }
    }
    
    if (totalSandboxes === 0) {
      console.log(chalk.gray('No active sandboxes found'));
      console.log(chalk.gray('💡 Create your first sandbox with: ') + chalk.white('create <folder>'));
    } else {
      console.log(chalk.green(`\nTotal: ${totalSandboxes} sandbox${totalSandboxes > 1 ? 'es' : ''}`));
      
      if (currentSandboxId) {
        console.log(chalk.cyan(`Current: ${currentSandboxId}`));
      } else {
        console.log(chalk.yellow('No current sandbox selected'));
        console.log(chalk.gray('💡 Select one with: ') + chalk.white('select'));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Failed to list sandboxes:'), error);
    process.exit(1);
  }
}