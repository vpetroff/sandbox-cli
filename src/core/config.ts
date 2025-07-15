import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface ProviderConfig {
  [key: string]: any;
}

export interface Config {
  defaultProvider?: string;
  currentSandbox?: string; // New: tracks selected sandbox
  providers: {
    [providerName: string]: ProviderConfig;
  };
  sandboxes?: { // New: local sandbox metadata cache
    [sandboxId: string]: SandboxMetadata;
  };
}

export interface SandboxMetadata {
  id: string;
  name: string;
  provider: string;
  status: string;
  url?: string;
  createdAt: Date;
  lastDeployedAt?: Date;
  deploymentCount: number;
  sourceFolder: string;
}

export class ConfigManager {
  private configDir: string;
  private configFile: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.sandbox-cli');
    this.configFile = path.join(this.configDir, 'config.json');
  }

  async ensureConfigDir(): Promise<void> {
    await fs.ensureDir(this.configDir);
  }

  async loadConfig(): Promise<Config> {
    await this.ensureConfigDir();
    
    if (await fs.pathExists(this.configFile)) {
      const content = await fs.readFile(this.configFile, 'utf-8');
      return JSON.parse(content);
    }
    
    return { providers: {} };
  }

  async saveConfig(config: Config): Promise<void> {
    await this.ensureConfigDir();
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
  }

  async getProviderConfig(providerName: string): Promise<ProviderConfig | undefined> {
    const config = await this.loadConfig();
    return config.providers[providerName];
  }

  async setProviderConfig(providerName: string, providerConfig: ProviderConfig): Promise<void> {
    const config = await this.loadConfig();
    config.providers[providerName] = providerConfig;
    await this.saveConfig(config);
  }

  async setDefaultProvider(providerName: string): Promise<void> {
    const config = await this.loadConfig();
    config.defaultProvider = providerName;
    await this.saveConfig(config);
  }

  async getDefaultProvider(): Promise<string | undefined> {
    const config = await this.loadConfig();
    return config.defaultProvider;
  }

  // New methods for sandbox state management
  async getCurrentSandbox(): Promise<string | undefined> {
    const config = await this.loadConfig();
    return config.currentSandbox;
  }

  async setCurrentSandbox(sandboxId: string): Promise<void> {
    const config = await this.loadConfig();
    config.currentSandbox = sandboxId;
    await this.saveConfig(config);
  }

  async clearCurrentSandbox(): Promise<void> {
    const config = await this.loadConfig();
    delete config.currentSandbox;
    await this.saveConfig(config);
  }

  async addSandboxMetadata(metadata: SandboxMetadata): Promise<void> {
    const config = await this.loadConfig();
    if (!config.sandboxes) {
      config.sandboxes = {};
    }
    config.sandboxes[metadata.id] = metadata;
    await this.saveConfig(config);
  }

  async updateSandboxMetadata(sandboxId: string, updates: Partial<SandboxMetadata>): Promise<void> {
    const config = await this.loadConfig();
    if (!config.sandboxes) {
      config.sandboxes = {};
    }
    if (config.sandboxes[sandboxId]) {
      config.sandboxes[sandboxId] = { ...config.sandboxes[sandboxId], ...updates };
      await this.saveConfig(config);
    }
  }

  async getSandboxMetadata(sandboxId: string): Promise<SandboxMetadata | undefined> {
    const config = await this.loadConfig();
    return config.sandboxes?.[sandboxId];
  }

  async removeSandboxMetadata(sandboxId: string): Promise<void> {
    const config = await this.loadConfig();
    if (config.sandboxes && config.sandboxes[sandboxId]) {
      delete config.sandboxes[sandboxId];
      await this.saveConfig(config);
    }
  }

  async listSandboxMetadata(): Promise<SandboxMetadata[]> {
    const config = await this.loadConfig();
    if (!config.sandboxes) {
      return [];
    }
    return Object.values(config.sandboxes);
  }

  async incrementDeploymentCount(sandboxId: string): Promise<void> {
    const config = await this.loadConfig();
    if (config.sandboxes && config.sandboxes[sandboxId]) {
      config.sandboxes[sandboxId].deploymentCount += 1;
      config.sandboxes[sandboxId].lastDeployedAt = new Date();
      await this.saveConfig(config);
    }
  }
}