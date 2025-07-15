import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../../core/config';
import { getProvider } from '../../providers';

export async function executeCommand(command: string, options: { cwd?: string; timeout?: number; noStream?: boolean }): Promise<void> {
  console.log(chalk.blue(`⚡ Executing command in current sandbox: ${chalk.white(command)}`));
  
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
    
    // Validate command
    if (!command || command.trim().length === 0) {
      console.log(chalk.red('❌ No command provided.'));
      console.log(chalk.gray('💡 Usage: ') + chalk.white('execute "<command>"'));
      process.exit(1);
    }
    
    const spinner = ora('Preparing command execution...').start();
    
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
        sourceFolder: process.cwd() // Use current directory as source
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
    
    // Check if provider supports command execution
    if (!provider.supportsExecution()) {
      spinner.fail('Command execution not supported');
      throw new Error(`Provider ${sandboxMetadata.provider} does not support command execution.`);
    }
    
    // Verify sandbox still exists and is running
    spinner.text = 'Verifying sandbox status...';
    try {
      const currentSandbox = await provider.getSandbox(currentSandboxId);
      if (!currentSandbox) {
        throw new Error('Sandbox no longer exists');
      }
      if (currentSandbox.status !== 'running' && currentSandbox.status !== 'deployed') {
        throw new Error(`Sandbox is not running (status: ${currentSandbox.status}). Please ensure the sandbox is active.`);
      }
    } catch (error) {
      spinner.fail('Sandbox verification failed');
      throw new Error(`Current sandbox ${currentSandboxId} is not accessible or not running. Try running "list" to check sandbox status.`);
    }
    
    spinner.text = `Executing command in sandbox...`;
    
    console.log(chalk.gray(`\n📦 Sandbox: ${sandboxMetadata.name} (${currentSandboxId})`));
    console.log(chalk.gray(`🔧 Provider: ${sandboxMetadata.provider}`));
    console.log(chalk.gray(`📁 Working Directory: ${options.cwd || '/workspaces/project'}`));
    console.log(chalk.gray(`⏱️  Timeout: ${options.timeout || 300} seconds`));
    console.log(chalk.blue(`\n▶️  ${command}\n`));
    
    spinner.stop();
    
    // Execute the command
    const startTime = Date.now();
    const result = await provider.executeCommand(currentSandboxId, {
      command: command.trim(),
      cwd: options.cwd || '/workspaces/project',
      timeout: options.timeout || 300,
      stream: !options.noStream
    });
    const duration = Date.now() - startTime;
    
    // Display results
    console.log(chalk.gray(`\n⏱️  Execution completed in ${duration}ms`));
    console.log(chalk.gray(`📤 Exit Code: ${result.exitCode === 0 ? chalk.green(result.exitCode) : chalk.red(result.exitCode)}`));
    
    if (result.exitCode === 0) {
      console.log(chalk.green('✅ Command executed successfully!'));
    } else {
      console.log(chalk.red('❌ Command failed!'));
      if (result.stderr && result.stderr.trim()) {
        console.log(chalk.red('\nError Output:'));
        console.log(result.stderr);
      }
    }
    
    // Exit with the same code as the executed command
    process.exit(result.exitCode);
    
  } catch (error) {
    console.error(chalk.red('Command execution failed:'), error);
    process.exit(1);
  }
}