import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface ProviderConfig {
  [key: string]: any;
}

export interface Config {
  defaultProvider?: string;
  providers: {
    [providerName: string]: ProviderConfig;
  };
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
}