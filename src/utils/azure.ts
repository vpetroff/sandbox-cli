import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export class AzureUtils {
  
  static async checkAzureCLIInstalled(): Promise<boolean> {
    try {
      await execAsync('az --version');
      return true;
    } catch {
      return false;
    }
  }

  static async checkAzureCLILoggedIn(): Promise<boolean> {
    try {
      await execAsync('az account show');
      return true;
    } catch {
      return false;
    }
  }

  static async validateAzureSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await execAsync(`az account show --subscription ${subscriptionId}`);
      return true;
    } catch {
      return false;
    }
  }

  static async validateResourceGroup(subscriptionId: string, resourceGroup: string): Promise<boolean> {
    try {
      await execAsync(`az group show --name ${resourceGroup} --subscription ${subscriptionId}`);
      return true;
    } catch {
      return false;
    }
  }

  static async validateContainerRegistry(subscriptionId: string, registryName: string): Promise<boolean> {
    try {
      await execAsync(`az acr show --name ${registryName} --subscription ${subscriptionId}`);
      return true;
    } catch {
      return false;
    }
  }

  static getAzureCLIInstallMessage(): string {
    return `
Azure CLI is required to use the Azure provider but is not installed.

Please install Azure CLI:
• Windows: Download from https://aka.ms/installazurecliwindows
• macOS: brew install azure-cli
• Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

After installation, run:
1. az login
2. az account set --subscription <your-subscription-id>
3. sandbox-cli configure azure
`;
  }

  static getAzureCLILoginMessage(): string {
    return `
Azure CLI is installed but you are not logged in.

Please run:
1. az login
2. az account set --subscription <your-subscription-id>
3. sandbox-cli configure azure
`;
  }
}