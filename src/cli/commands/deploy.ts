import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ConfigManager } from '../../core/config';
import { getProvider } from '../../providers';

export async function deployCommand(folder: string, options: { dockerfile?: string }): Promise<void> {
  console.log(chalk.blue(`🚀 Deploying ${folder} to current sandbox...`));
  
  const configManager = new ConfigManager();
  
  try {
    // Check if there's a current sandbox selected
    const currentSandboxId = await configManager.getCurrentSandbox();
    if (!currentSandboxId) {
      console.log(chalk.red('❌ No current sandbox selected.'));
      console.log(chalk.gray('💡 Select a sandbox with: ') + chalk.white('select'));
      console.log(chalk.gray('💡 Or create a new one with: ') + chalk.white('create <folder>'));
      process.exit(1);
    }
    
    // Resolve folder path
    const folderPath = path.resolve(folder);
    if (!await fs.pathExists(folderPath)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }
    
    // Check for Dockerfile (optional for incremental updates)
    let dockerfilePath: string | undefined;
    if (options.dockerfile) {
      dockerfilePath = path.resolve(options.dockerfile);
      if (!await fs.pathExists(dockerfilePath)) {
        throw new Error(`Dockerfile not found: ${dockerfilePath}`);
      }
    }
    
    const spinner = ora('Preparing deployment...').start();
    
    // Get sandbox metadata
    let sandboxMetadata = await configManager.getSandboxMetadata(currentSandboxId);
    if (!sandboxMetadata) {
      spinner.text = 'Sandbox metadata not found, fetching from providers...';
      
      // Try to find the sandbox across all providers and create metadata
      const config = await configManager.loadConfig();
      const providerNames = Object.keys(config.providers);
      
      let foundSandbox: any = null;
      let foundProviderName: string | null = null;
      
      for (const providerName of providerNames) {
        try {
          const provider = getProvider(providerName);
          if (!await provider.isConfigured()) continue;
          
          const sandbox = await provider.getSandbox(currentSandboxId);
          if (sandbox) {
            foundSandbox = sandbox;
            foundProviderName = providerName;
            break;
          }
        } catch (error) {
          // Continue to next provider
          continue;
        }
      }
      
      if (!foundSandbox || !foundProviderName) {
        spinner.fail('Sandbox not found');
        throw new Error(`Sandbox ${currentSandboxId} not found in any configured provider. Try running "select" to choose a valid sandbox.`);
      }
      
      // Create metadata for the existing sandbox
      sandboxMetadata = {
        id: foundSandbox.id,
        name: foundSandbox.name,
        provider: foundProviderName,
        status: foundSandbox.status,
        url: foundSandbox.url,
        createdAt: foundSandbox.createdAt,
        deploymentCount: 0,
        sourceFolder: folderPath // Use current folder as source
      };
      
      // Store the metadata for future use
      await configManager.addSandboxMetadata(sandboxMetadata);
      
      spinner.text = 'Sandbox found and metadata created...';
    }
    
    // Get provider instance
    const provider = getProvider(sandboxMetadata.provider);
    
    // Check if provider is configured
    if (!await provider.isConfigured()) {
      spinner.fail('Provider not configured');
      throw new Error(`Provider ${sandboxMetadata.provider} not configured. Run "sandbox-cli configure ${sandboxMetadata.provider}"`);
    }
    
    // Verify sandbox still exists
    spinner.text = 'Verifying sandbox status...';
    try {
      const currentSandbox = await provider.getSandbox(currentSandboxId);
      if (!currentSandbox) {
        throw new Error('Sandbox no longer exists');
      }
    } catch (error) {
      spinner.fail('Sandbox verification failed');
      throw new Error(`Current sandbox ${currentSandboxId} is no longer accessible. Try running "select" to choose a different sandbox.`);
    }
    
    spinner.text = 'Deploying code to sandbox...';
    
    // Deploy to the existing sandbox
    const result = await provider.deployToSandbox(currentSandboxId, {
      folder: folderPath,
      dockerfile: dockerfilePath
    });
    
    // Update deployment metadata
    await configManager.incrementDeploymentCount(currentSandboxId);
    await configManager.updateSandboxMetadata(currentSandboxId, {
      status: result.instance.status,
      url: result.instance.url,
      lastDeployedAt: new Date()
    });
    
    spinner.succeed('Deployment completed successfully!');
    
    console.log(chalk.green('✅ Code deployed to sandbox!'));
    console.log(chalk.gray(`   Sandbox ID: ${result.instance.id}`));
    console.log(chalk.gray(`   Name: ${result.instance.name}`));
    console.log(chalk.gray(`   Provider: ${sandboxMetadata.provider}`));
    console.log(chalk.gray(`   Status: ${result.instance.status}`));
    console.log(chalk.gray(`   Source Folder: ${folderPath}`));
    if (dockerfilePath) {
      console.log(chalk.gray(`   Dockerfile: ${dockerfilePath}`));
    }
    
    if (result.instance.url) {
      console.log(chalk.blue(`🌐 Application URL: ${result.instance.url}`));
    }
    
    if (result.logs && result.logs.length > 0) {
      console.log(chalk.gray('\nDeployment logs:'));
      result.logs.forEach(log => console.log(chalk.gray(`   ${log}`)));
    }
    
    // Show deployment count
    const updatedMetadata = await configManager.getSandboxMetadata(currentSandboxId);
    if (updatedMetadata) {
      console.log(chalk.cyan(`\n📊 Total deployments to this sandbox: ${updatedMetadata.deploymentCount}`));
    }
    
    console.log(chalk.cyan('\n📝 Next steps:'));
    console.log(chalk.gray(`   • Open in browser: ${chalk.white('browse ' + currentSandboxId)}`));
    console.log(chalk.gray(`   • View all sandboxes: ${chalk.white('list')}`));
    console.log(chalk.gray(`   • Switch sandboxes: ${chalk.white('select')}`));
    
  } catch (error) {
    console.error(chalk.red('Deployment failed:'), error);
    process.exit(1);
  }
}