import { BaseSandboxProvider } from './base';
import { DaytonaProvider } from './daytona';
import { AzureACIProvider } from './azure-aci';

export function getProvider(providerName: string): BaseSandboxProvider {
  switch (providerName) {
    case 'daytona':
      return new DaytonaProvider();
    case 'e2b':
      throw new Error('E2B provider not implemented yet');
    case 'azure':
      return new AzureACIProvider();
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

export { BaseSandboxProvider, DaytonaProvider, AzureACIProvider };