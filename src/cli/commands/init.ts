import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ConfigManager } from '../../core/config';

export async function initCommand(): Promise<void> {
  console.log(chalk.blue('🚀 Initializing Sandbox CLI...'));
  
  const spinner = ora('Setting up configuration...').start();
  const configManager = new ConfigManager();
  
  try {
    await configManager.ensureConfigDir();
    spinner.succeed('Configuration directory created');
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'defaultProvider',
        message: 'Select your default sandbox provider:',
        choices: [
          { name: 'Daytona', value: 'daytona' },
          { name: 'E2B', value: 'e2b' },
          { name: 'Azure Container Instances', value: 'azure' },
          { name: 'Skip for now', value: null }
        ]
      }
    ]);
    
    if (answers.defaultProvider) {
      await configManager.setDefaultProvider(answers.defaultProvider);
      console.log(chalk.green(`✅ Default provider set to: ${answers.defaultProvider}`));
      console.log(chalk.yellow(`💡 Run 'sandbox-cli configure ${answers.defaultProvider}' to set up your provider`));
    }
    
    console.log(chalk.green('✅ Sandbox CLI initialized successfully!'));
    console.log(chalk.gray('Configuration stored in ~/.sandbox-cli/config.json'));
    
  } catch (error) {
    spinner.fail('Failed to initialize configuration');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}