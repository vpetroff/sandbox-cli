import chalk from 'chalk';
import { getProviderPrompts } from '../prompts/provider-prompts';
import { ConfigManager } from '../../core/config';

export async function configureCommand(provider: string): Promise<void> {
  console.log(chalk.blue(`🔧 Configuring ${provider} provider...`));
  
  const configManager = new ConfigManager();
  
  try {
    const prompts = getProviderPrompts(provider);
    const config = await prompts.configure();
    
    await configManager.setProviderConfig(provider, config);
    
    console.log(chalk.green(`✅ ${provider} provider configured successfully!`));
    
  } catch (error) {
    console.error(chalk.red('Error configuring provider:'), error);
    process.exit(1);
  }
}