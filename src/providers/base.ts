export interface DeploymentOptions {
  folder: string;
  dockerfile: string;
  name?: string;
}

export interface CreateSandboxOptions {
  folder: string;
  dockerfile: string;
  name?: string;
  provider?: string;
}

export interface DeployOptions {
  folder: string;
  dockerfile?: string; // Optional for incremental updates
}

export interface SandboxInstance {
  id: string;
  name: string;
  status: string;
  url?: string;
  provider: string;
  createdAt: Date;
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

export interface DeploymentResult {
  instance: SandboxInstance;
  logs?: string[];
}

export interface ExecuteOptions {
  command: string;
  cwd?: string;
  timeout?: number;
  stream?: boolean;
}

export interface ExecuteResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

// Sandbox lifecycle states
export const SandboxStatus = {
  CREATING: 'creating',
  READY: 'ready',
  DEPLOYED: 'deployed',
  ERROR: 'error',
  DESTROYED: 'destroyed'
} as const;

export abstract class BaseSandboxProvider {
  abstract name: string;
  
  abstract configure(): Promise<void>;
  abstract isConfigured(): Promise<boolean>;
  abstract deploy(options: DeploymentOptions): Promise<DeploymentResult>;
  abstract list(): Promise<SandboxInstance[]>;
  abstract destroy(instanceId: string): Promise<void>;
  abstract getInstanceUrl(instanceId: string): Promise<string | undefined>;
  abstract getInstanceStatus(instanceId: string): Promise<SandboxInstance['status']>;
  
  // New methods for split workflow
  abstract createSandbox(options: CreateSandboxOptions): Promise<SandboxInstance>;
  abstract deployToSandbox(sandboxId: string, options: DeployOptions): Promise<DeploymentResult>;
  abstract getSandbox(sandboxId: string): Promise<SandboxInstance>;
  
  // New methods for command execution
  abstract executeCommand(sandboxId: string, options: ExecuteOptions): Promise<ExecuteResult>;
  abstract supportsExecution(): boolean;
  
  protected generateInstanceId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  
  protected generateInstanceName(folder: string): string {
    const folderName = folder.split('/').pop() || 'app';
    return `${folderName}-${Date.now()}`;
  }
}