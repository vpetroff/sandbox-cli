import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ConfigManager } from '../../core/config';
import { getProvider } from '../../providers';

export async function deployCommand(folder: string, options: { provider?: string; dockerfile: string }): Promise<void> {
  console.log(chalk.blue(`🚀 Deploying ${folder} to sandbox...`));
  
  const configManager = new ConfigManager();
  
  try {
    // Resolve folder path
    const folderPath = path.resolve(folder);
    if (!await fs.pathExists(folderPath)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }
    
    // Check for Dockerfile
    const dockerfilePath = path.resolve(options.dockerfile);
    if (!await fs.pathExists(dockerfilePath)) {
      throw new Error(`Dockerfile not found: ${dockerfilePath}`);
    }
    
    // Determine provider
    let providerName = options.provider;
    if (!providerName) {
      providerName = await configManager.getDefaultProvider();
      if (!providerName) {
        throw new Error('No provider specified and no default provider set. Use --provider or run "sandbox-cli init"');
      }
    }
    
    // Check if provider is configured
    const providerConfig = await configManager.getProviderConfig(providerName);
    if (!providerConfig) {
      throw new Error(`Provider ${providerName} not configured. Run "sandbox-cli configure ${providerName}"`);
    }
    
    const spinner = ora('Preparing deployment...').start();
    
    // Get provider instance
    const provider = getProvider(providerName);
    
    // Check if provider is configured
    if (!await provider.isConfigured()) {
      spinner.fail('Provider not configured');
      throw new Error(`Provider ${providerName} not configured. Run "sandbox-cli configure ${providerName}"`);
    }
    
    spinner.text = 'Creating sandbox and deploying...';
    
    // Deploy using the provider
    const result = await provider.deploy({
      folder: folderPath,
      dockerfile: dockerfilePath
    });
    
    spinner.succeed('Deployment completed successfully!');
    
    console.log(chalk.green('✅ Sandbox deployed successfully!'));
    console.log(chalk.gray(`   Provider: ${providerName}`));
    console.log(chalk.gray(`   Sandbox ID: ${result.instance.id}`));
    console.log(chalk.gray(`   Name: ${result.instance.name}`));
    console.log(chalk.gray(`   Status: ${result.instance.status}`));
    console.log(chalk.gray(`   Folder: ${folderPath}`));
    console.log(chalk.gray(`   Dockerfile: ${dockerfilePath}`));
    
    if (result.instance.url) {
      console.log(chalk.blue(`🌐 Sandbox URL: ${result.instance.url}`));
    }
    
    if (result.logs && result.logs.length > 0) {
      console.log(chalk.gray('\nDeployment logs:'));
      result.logs.forEach(log => console.log(chalk.gray(`   ${log}`)));
    }
    
  } catch (error) {
    console.error(chalk.red('Deployment failed:'), error);
    process.exit(1);
  }
}