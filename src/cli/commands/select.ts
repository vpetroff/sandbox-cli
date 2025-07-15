import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigManager } from '../../core/config';
import { getProvider } from '../../providers';

export async function selectCommand(): Promise<void> {
  console.log(chalk.blue('🎯 Select current sandbox...'));
  
  const configManager = new ConfigManager();
  
  try {
    const config = await configManager.loadConfig();
    const providerNames = Object.keys(config.providers);
    
    if (providerNames.length === 0) {
      console.log(chalk.yellow('No providers configured. Run "sandbox-cli configure <provider>"'));
      return;
    }
    
    // Collect all sandboxes from all providers
    const allSandboxes: Array<{
      id: string;
      name: string;
      provider: string;
      status: string;
      url?: string;
      createdAt: Date;
    }> = [];
    
    for (const providerName of providerNames) {
      try {
        const provider = getProvider(providerName);
        
        if (!await provider.isConfigured()) {
          console.log(chalk.yellow(`⚠️  Provider ${providerName} not configured, skipping...`));
          continue;
        }
        
        const instances = await provider.list();
        allSandboxes.push(...instances);
        
      } catch (error) {
        console.log(chalk.red(`❌ Error listing ${providerName} sandboxes: ${error}`));
      }
    }
    
    if (allSandboxes.length === 0) {
      console.log(chalk.yellow('No sandboxes found.'));
      console.log(chalk.gray('💡 Create your first sandbox with: ') + chalk.white('create <folder>'));
      return;
    }
    
    // Get current sandbox for highlighting
    const currentSandboxId = await configManager.getCurrentSandbox();
    
    // Create choices for inquirer
    const choices = allSandboxes.map(sandbox => {
      const statusColor = sandbox.status === 'running' || sandbox.status === 'deployed' ? chalk.green : 
                         sandbox.status === 'error' ? chalk.red : 
                         chalk.yellow;
      
      const isCurrent = sandbox.id === currentSandboxId;
      const currentIndicator = isCurrent ? chalk.cyan(' (current)') : '';
      
      return {
        name: `${chalk.cyan(sandbox.id)} - ${sandbox.name} [${chalk.gray(sandbox.provider)}] ${statusColor(sandbox.status)}${currentIndicator}`,
        value: sandbox.id,
        short: sandbox.id
      };
    });
    
    const { selectedSandboxId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedSandboxId',
        message: 'Select sandbox to make current:',
        choices,
        pageSize: 10
      }
    ]);
    
    // Set the selected sandbox as current
    await configManager.setCurrentSandbox(selectedSandboxId);
    
    // Find the selected sandbox details for confirmation
    const selectedSandbox = allSandboxes.find(s => s.id === selectedSandboxId);
    
    console.log(chalk.green('✅ Current sandbox updated!'));
    if (selectedSandbox) {
      console.log(chalk.gray(`   Selected: ${selectedSandbox.id} - ${selectedSandbox.name}`));
      console.log(chalk.gray(`   Provider: ${selectedSandbox.provider}`));
      console.log(chalk.gray(`   Status: ${selectedSandbox.status}`));
      if (selectedSandbox.url) {
        console.log(chalk.gray(`   URL: ${selectedSandbox.url}`));
      }
    }
    
    console.log(chalk.cyan('\n📝 Next steps:'));
    console.log(chalk.gray(`   • Deploy code: ${chalk.white('deploy <folder>')}`));
    console.log(chalk.gray(`   • View sandboxes: ${chalk.white('list')}`));
    console.log(chalk.gray(`   • Open in browser: ${chalk.white('browse ' + selectedSandboxId)}`));
    
  } catch (error) {
    console.error(chalk.red('Failed to select sandbox:'), error);
    process.exit(1);
  }
}