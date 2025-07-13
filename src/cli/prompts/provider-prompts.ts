import inquirer from 'inquirer';
import { ProviderConfig } from '../../core/config';

export interface ProviderPrompts {
  configure(): Promise<ProviderConfig>;
}

class DaytonaPrompts implements ProviderPrompts {
  async configure(): Promise<ProviderConfig> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your Daytona API key:',
        validate: (input) => input.length > 0 || 'API key is required'
      },
      {
        type: 'input',
        name: 'serverUrl',
        message: 'Enter your Daytona server URL:',
        default: 'https://api.daytona.io',
        validate: (input) => input.startsWith('http') || 'Must be a valid URL'
      },
      {
        type: 'input',
        name: 'defaultRegion',
        message: 'Enter default region:',
        default: 'us-east-1'
      }
    ]);
    
    return answers;
  }
}

class E2BPrompts implements ProviderPrompts {
  async configure(): Promise<ProviderConfig> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your E2B API key:',
        validate: (input) => input.length > 0 || 'API key is required'
      },
      {
        type: 'list',
        name: 'template',
        message: 'Select default template:',
        choices: [
          { name: 'Node.js 18', value: 'node-18' },
          { name: 'Python 3.11', value: 'python-3.11' },
          { name: 'Custom', value: 'custom' }
        ]
      }
    ]);
    
    if (answers.template === 'custom') {
      const customTemplate = await inquirer.prompt([
        {
          type: 'input',
          name: 'customTemplate',
          message: 'Enter custom template ID:',
          validate: (input) => input.length > 0 || 'Template ID is required'
        }
      ]);
      answers.template = customTemplate.customTemplate;
    }
    
    return answers;
  }
}

class AzurePrompts implements ProviderPrompts {
  async configure(): Promise<ProviderConfig> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'subscriptionId',
        message: 'Enter your Azure subscription ID:',
        validate: (input) => input.length > 0 || 'Subscription ID is required'
      },
      {
        type: 'input',
        name: 'resourceGroup',
        message: 'Enter resource group name:',
        validate: (input) => input.length > 0 || 'Resource group is required'
      },
      {
        type: 'input',
        name: 'location',
        message: 'Enter Azure location:',
        default: 'eastus'
      },
      {
        type: 'input',
        name: 'tenantId',
        message: 'Enter tenant ID (optional):',
      },
      {
        type: 'input',
        name: 'clientId',
        message: 'Enter client ID (optional):',
      },
      {
        type: 'password',
        name: 'clientSecret',
        message: 'Enter client secret (optional):',
      }
    ]);
    
    return answers;
  }
}

export function getProviderPrompts(provider: string): ProviderPrompts {
  switch (provider) {
    case 'daytona':
      return new DaytonaPrompts();
    case 'e2b':
      return new E2BPrompts();
    case 'azure':
      return new AzurePrompts();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}