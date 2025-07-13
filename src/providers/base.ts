export interface DeploymentOptions {
  folder: string;
  dockerfile: string;
  name?: string;
}

export interface SandboxInstance {
  id: string;
  name: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  url?: string;
  provider: string;
  createdAt: Date;
}

export interface DeploymentResult {
  instance: SandboxInstance;
  logs?: string[];
}

export abstract class BaseSandboxProvider {
  abstract name: string;
  
  abstract configure(): Promise<void>;
  abstract isConfigured(): Promise<boolean>;
  abstract deploy(options: DeploymentOptions): Promise<DeploymentResult>;
  abstract list(): Promise<SandboxInstance[]>;
  abstract destroy(instanceId: string): Promise<void>;
  abstract getInstanceUrl(instanceId: string): Promise<string | undefined>;
  abstract getInstanceStatus(instanceId: string): Promise<SandboxInstance['status']>;
  
  protected generateInstanceId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  protected generateInstanceName(folder: string): string {
    const folderName = folder.split('/').pop() || 'app';
    return `${folderName}-${Date.now()}`;
  }
}