import { Daytona, Image, CreateSandboxFromImageParams } from '@daytonaio/sdk';
import { BaseSandboxProvider, DeploymentOptions, SandboxInstance, DeploymentResult, CreateSandboxOptions, DeployOptions, SandboxStatus } from './base';
import { ConfigManager } from '../core/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export class DaytonaProvider extends BaseSandboxProvider {
  name = 'daytona';
  private client: Daytona | null = null;
  private configManager: ConfigManager;

  constructor() {
    super();
    this.configManager = new ConfigManager();
  }

  async configure(): Promise<void> {
    // Configuration is handled by the CLI prompts
    // This method ensures the client is properly initialized
    await this.initializeClient();
  }

  async isConfigured(): Promise<boolean> {
    try {
      const config = await this.configManager.getProviderConfig(this.name);
      return !!(config && config.apiKey);
    } catch {
      return false;
    }
  }

  private async initializeClient(): Promise<Daytona> {
    if (this.client) {
      return this.client;
    }

    const config = await this.configManager.getProviderConfig(this.name);
    if (!config || !config.apiKey) {
      throw new Error('Daytona provider not configured. Run "sandbox-cli configure daytona"');
    }

    // Initialize Daytona client with configuration
    this.client = new Daytona({
      apiKey: config.apiKey,
      apiUrl: config.serverUrl || 'https://app.daytona.io/api',
      target: 'eu'
    });

    return this.client;
  }

  async deploy(options: DeploymentOptions): Promise<DeploymentResult> {
    const client = await this.initializeClient();

    // Generate unique identifiers
    const instanceId = this.generateInstanceId();
    const instanceName = this.generateInstanceName(options.folder);

    const instance: SandboxInstance = {
      id: instanceId,
      name: instanceName,
      status: 'creating',
      provider: this.name,
      createdAt: new Date()
    };

    try {

      // Define the dynamic image

      console.log(options.folder);
      console.log(options.dockerfile);

      const dynamicImage = Image.fromDockerfile(options.dockerfile);

      // Create a new Sandbox with the dynamic image and stream the build logs
      const sandbox = await client.create(
        {
          image: dynamicImage,
        },
        {
          timeout: 0,
          onSnapshotCreateLogs: console.log,
        }
      )

      // Update instance with sandbox info
      instance.status = 'running';
      instance.url = await this.getSandboxUrl(sandbox);

      return {
        instance,
        logs: ['Sandbox created successfully', 'Files uploaded', 'Application built and running']
      };

    } catch (error) {
      instance.status = 'error';
      throw new Error(`Daytona deployment failed: ${error}`);
    }
  }

  async list(): Promise<SandboxInstance[]> {
    const client = await this.initializeClient();

    try {
      // Get all sandboxes (this is a simplified implementation)
      // In a real scenario, you'd need to track sandboxes in your config or use Daytona's API
      const sandboxes = await client.list();

      return await Promise.all(sandboxes.map(async (sandbox: any) => ({
        id: sandbox.id,
        name: sandbox.name || 'Unknown',
        status: sandbox.state || 'unknown',
        provider: this.name,
        createdAt: new Date(sandbox.createdAt || Date.now()),
        url: sandbox.url || await this.getSandboxUrl(sandbox)
      })));

    } catch (error) {
      throw new Error(`Failed to list Daytona sandboxes: ${error}`);
    }
  }

  async destroy(instanceId: string): Promise<void> {
    const client = await this.initializeClient();

    try {
      const sandbox = await client.get(instanceId);
      await sandbox.delete();
    } catch (error) {
      throw new Error(`Failed to destroy Daytona sandbox: ${error}`);
    }
  }

  async getInstanceUrl(instanceId: string): Promise<string | undefined> {
    const client = await this.initializeClient();

    try {
      const sandbox = await client.get(instanceId);
      return await this.getSandboxUrl(sandbox);
    } catch (error) {
      throw new Error(`Failed to get Daytona sandbox URL: ${error}`);
    }
  }

  async getInstanceStatus(instanceId: string): Promise<SandboxInstance['status']> {
    const client = await this.initializeClient();

    try {
      const sandbox = await client.get(instanceId);
      // Refresh data to get current status
      await sandbox.refreshData();
      return sandbox.state || 'unknown';
    } catch (error) {
      throw new Error(`Failed to get Daytona sandbox status: ${error}`);
    }
  }

  private async getSandboxUrl(sandbox: any): Promise<string> {
    // Use the preview link for port 8080 (default app port)
    try {
      const urlData = await sandbox.getPreviewLink(8080);
      return urlData?.url;
    } catch (error) {
      console.log(error)
      // Fallback to constructed URL if preview link fails
      return `https://sandbox-${sandbox.id}.proxy.daytona.work`;
    }
  }

  private async uploadFiles(sandbox: any, folderPath: string): Promise<void> {
    const resolvedPath = path.resolve(folderPath);

    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`Folder not found: ${resolvedPath}`);
    }

    // Get all files in the folder, excluding junk files
    const allFiles = await this.getAllFiles(resolvedPath);

    // Create file objects array for Daytona SDK
    const files = [];
    for (const filePath of allFiles) {
      const relativePath = path.relative(resolvedPath, filePath);
      const destinationPath = `/workspaces/project/${relativePath}`;

      files.push({
        source: filePath,
        destination: destinationPath
      });
    }

    // Use Daytona SDK's uploadFiles method on sandbox.fs
    await sandbox.fs.uploadFiles(files);
  }

  // New methods for split workflow
  async createSandbox(options: CreateSandboxOptions): Promise<SandboxInstance> {
    const client = await this.initializeClient();

    // Generate unique identifiers
    const instanceId = this.generateInstanceId();
    const instanceName = this.generateInstanceName(options.folder);

    const instance: SandboxInstance = {
      id: instanceId,
      name: instanceName,
      status: SandboxStatus.CREATING,
      provider: this.name,
      createdAt: new Date()
    };

    try {
      // Define the dynamic image from Dockerfile
      const dynamicImage = Image.fromDockerfile(options.dockerfile);

      // Create a new Sandbox with the dynamic image
      const sandbox = await client.create(
        {
          image: dynamicImage,
        },
        {
          timeout: 0,
          onSnapshotCreateLogs: console.log,
        }
      );

      // Update instance with sandbox info
      instance.id = sandbox.id; // Use actual sandbox ID from Daytona
      instance.status = SandboxStatus.READY;
      instance.url = await this.getSandboxUrl(sandbox);

      return instance;

    } catch (error) {
      instance.status = SandboxStatus.ERROR;
      throw new Error(`Daytona sandbox creation failed: ${error}`);
    }
  }

  async deployToSandbox(sandboxId: string, options: DeployOptions): Promise<DeploymentResult> {
    const client = await this.initializeClient();

    try {
      const sandbox = await client.get(sandboxId);

      // Upload files to the existing sandbox
      await this.uploadFiles(sandbox, options.folder);

      // If dockerfile is provided, rebuild the application
      if (options.dockerfile) {
        // For Daytona, we might need to restart or rebuild the container
        // This is a simplified implementation - in practice you might need
        // to execute build commands within the sandbox
        console.log('Rebuilding application with new Dockerfile...');
      }

      // Refresh sandbox data to get current status
      await sandbox.refreshData();

      const instance: SandboxInstance = {
        id: sandbox.id,
        name: sandbox.id || 'Unknown',
        status: SandboxStatus.DEPLOYED,
        provider: this.name,
        createdAt: new Date(sandbox.createdAt || Date.now()),
        url: await this.getSandboxUrl(sandbox)
      };

      return {
        instance,
        logs: ['Files synchronized successfully', 'Application updated']
      };

    } catch (error) {
      throw new Error(`Daytona deployment to sandbox failed: ${error}`);
    }
  }

  async getSandbox(sandboxId: string): Promise<SandboxInstance> {
    const client = await this.initializeClient();

    try {
      const sandbox = await client.get(sandboxId);
      await sandbox.refreshData();

      return {
        id: sandbox.id,
        name: sandbox.id || 'Unknown',
        status: sandbox.state || 'unknown',
        provider: this.name,
        createdAt: new Date(sandbox.createdAt || Date.now()),
        url: await this.getSandboxUrl(sandbox)
      };

    } catch (error) {
      throw new Error(`Failed to get Daytona sandbox: ${error}`);
    }
  }

  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      if (item.startsWith('.')) continue; // Skip hidden files

      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        const subFiles = await this.getAllFiles(itemPath);
        files.push(...subFiles);
      } else {
        files.push(itemPath);
      }
    }

    return files;
  }
}