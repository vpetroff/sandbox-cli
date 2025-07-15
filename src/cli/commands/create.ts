import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ConfigManager } from '../../core/config';
import { getProvider } from '../../providers';
import { SandboxStatus } from '../../providers/base';

export async function createCommand(folder: string, options: { provider?: string; dockerfile: string }): Promise<void> {
  console.log(chalk.blue(`🏗️  Creating sandbox for ${folder}...`));
  
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
    
    const spinner = ora('Preparing sandbox creation...').start();
    
    // Get provider instance
    const provider = getProvider(providerName);
    
    // Check if provider is configured
    if (!await provider.isConfigured()) {
      spinner.fail('Provider not configured');
      throw new Error(`Provider ${providerName} not configured. Run "sandbox-cli configure ${providerName}"`);
    }
    
    spinner.text = 'Creating sandbox environment...';
    
    // Create sandbox using the provider
    const instance = await provider.createSandbox({
      folder: folderPath,
      dockerfile: dockerfilePath,
      provider: providerName
    });
    
    spinner.text = 'Storing sandbox metadata...';
    
    // Store sandbox metadata
    await configManager.addSandboxMetadata({
      id: instance.id,
      name: instance.name,
      provider: instance.provider,
      status: instance.status,
      url: instance.url,
      createdAt: instance.createdAt,
      deploymentCount: 0,
      sourceFolder: folderPath
    });
    
    // Set as current sandbox
    await configManager.setCurrentSandbox(instance.id);
    
    spinner.succeed('Sandbox created successfully!');
    
    console.log(chalk.green('✅ Sandbox created and selected!'));
    console.log(chalk.gray(`   Provider: ${providerName}`));
    console.log(chalk.gray(`   Sandbox ID: ${instance.id}`));
    console.log(chalk.gray(`   Name: ${instance.name}`));
    console.log(chalk.gray(`   Status: ${instance.status}`));
    console.log(chalk.gray(`   Source Folder: ${folderPath}`));
    console.log(chalk.gray(`   Dockerfile: ${dockerfilePath}`));
    
    if (instance.url) {
      console.log(chalk.blue(`🌐 Sandbox URL: ${instance.url}`));
    }
    
    console.log(chalk.cyan('\n📝 Next steps:'));
    console.log(chalk.gray(`   • Deploy your code: ${chalk.white('deploy ${folder}')}`));
    console.log(chalk.gray(`   • View all sandboxes: ${chalk.white('list')}`));
    console.log(chalk.gray(`   • Switch sandboxes: ${chalk.white('select')}`));
    
  } catch (error) {
    console.error(chalk.red('Sandbox creation failed:'), error);
    process.exit(1);
  }
}