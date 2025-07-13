import { BaseSandboxProvider } from './base';
import { DaytonaProvider } from './daytona';

export function getProvider(providerName: string): BaseSandboxProvider {
  switch (providerName) {
    case 'daytona':
      return new DaytonaProvider();
    case 'e2b':
      throw new Error('E2B provider not implemented yet');
    case 'azure':
      throw new Error('Azure provider not implemented yet');
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

export { BaseSandboxProvider, DaytonaProvider };