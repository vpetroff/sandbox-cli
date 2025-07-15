import { ContainerInstanceManagementClient } from '@azure/arm-containerinstance';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { BaseSandboxProvider, DeploymentOptions, SandboxInstance, DeploymentResult, CreateSandboxOptions, DeployOptions, SandboxStatus, ExecuteOptions, ExecuteResult } from './base';
import { ConfigManager } from '../core/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DockerUtils } from '../utils/docker';
import { AzureUtils } from '../utils/azure';

export class AzureACIProvider extends BaseSandboxProvider {
  name = 'azure';
  private client: ContainerInstanceManagementClient | null = null;
  private configManager: ConfigManager;
  
  constructor() {
    super();
    this.configManager = new ConfigManager();
  }

  async configure(): Promise<void> {
    // Check Azure CLI availability before configuration
    await this.validateAzurePrerequisites();
    
    // Configuration is handled by the CLI prompts
    // This method ensures the client is properly initialized
    await this.initializeClient();
  }

  async isConfigured(): Promise<boolean> {
    try {
      const config = await this.configManager.getProviderConfig(this.name);
      return !!(config && config.subscriptionId && config.resourceGroup && config.containerRegistry);
    } catch {
      return false;
    }
  }

  private async initializeClient(): Promise<ContainerInstanceManagementClient> {
    if (this.client) {
      return this.client;
    }

    const config = await this.configManager.getProviderConfig(this.name);
    if (!config || !config.subscriptionId || !config.resourceGroup || !config.containerRegistry) {
      throw new Error('Azure provider not configured. Run "sandbox-cli configure azure"');
    }

    let credential;
    
    // Use service principal authentication if credentials are provided
    if (config.tenantId && config.clientId && config.clientSecret) {
      credential = new ClientSecretCredential(
        config.tenantId,
        config.clientId,
        config.clientSecret
      );
    } else {
      // Fall back to default Azure credential (Azure CLI, Managed Identity, etc.)
      credential = new DefaultAzureCredential();
    }

    this.client = new ContainerInstanceManagementClient(
      credential,
      config.subscriptionId
    );

    return this.client;
  }

  async deploy(options: DeploymentOptions): Promise<DeploymentResult> {
    // Validate Azure prerequisites before deployment
    await this.validateAzurePrerequisites();
    
    const client = await this.initializeClient();
    const config = await this.configManager.getProviderConfig(this.name);
    
    if (!config) {
      throw new Error('Azure provider configuration not found');
    }
    
    // Generate unique identifiers
    const instanceId = this.generateInstanceId();
    const instanceName = this.generateInstanceName(options.folder);
    const containerGroupName = `${instanceName}-cg`;
    
    const instance: SandboxInstance = {
      id: instanceId,
      name: instanceName,
      status: 'creating',
      provider: this.name,
      createdAt: new Date()
    };

    try {
      // Build Docker image and push to a registry
      const imageUri = await this.buildAndPushImage(options, containerGroupName);
      
      // Create container group configuration with registry credentials
      const containerGroupSpec = {
        location: config.location || 'eastus',
        containers: [
          {
            name: instanceName,
            image: imageUri,
            resources: {
              requests: {
                cpu: 1,
                memoryInGB: 1.5
              }
            },
            ports: [
              {
                protocol: 'TCP',
                port: 8080
              }
            ],
            environmentVariables: [
              {
                name: 'NODE_ENV',
                value: 'production'
              },
              {
                name: 'PORT',
                value: '8080'
              }
            ]
          }
        ],
        osType: 'Linux',
        imageRegistryCredentials: await this.getImageRegistryCredentials(config),
        ipAddress: {
          type: 'Public',
          ports: [
            {
              protocol: 'TCP',
              port: 8080
            }
          ]
        },
        restartPolicy: 'OnFailure'
      };

      // Deploy container group
      const deploymentResult = await client.containerGroups.beginCreateOrUpdateAndWait(
        config.resourceGroup,
        containerGroupName,
        containerGroupSpec
      );

      // Update instance with deployment info
      instance.status = 'running';
      instance.url = this.getContainerUrl(deploymentResult);

      return {
        instance,
        logs: [
          'Docker image built and pushed to registry',
          'Container group created successfully',
          'Application is running'
        ]
      };

    } catch (error) {
      instance.status = 'error';
      throw new Error(`Azure ACI deployment failed: ${error}`);
    }
  }

  async list(): Promise<SandboxInstance[]> {
    const client = await this.initializeClient();
    const config = await this.configManager.getProviderConfig(this.name);
    
    if (!config) {
      throw new Error('Azure provider configuration not found');
    }
    
    try {
      const containerGroups = [];
      
      // List all container groups in the resource group
      for await (const containerGroup of client.containerGroups.listByResourceGroup(config.resourceGroup)) {
        // Filter only our sandbox containers (those with our naming pattern)
        if (containerGroup.name && containerGroup.name.includes('-cg')) {
          containerGroups.push(containerGroup);
        }
      }
      
      return containerGroups.map((cg: any) => ({
        id: cg.name || 'unknown',
        name: cg.name?.replace('-cg', '') || 'Unknown',
        status: this.mapAzureStatus(cg.instanceView?.state),
        provider: this.name,
        createdAt: new Date(Date.now()),
        url: this.getContainerUrl(cg)
      }));

    } catch (error) {
      throw new Error(`Failed to list Azure ACI containers: ${error}`);
    }
  }

  async destroy(instanceId: string): Promise<void> {
    const client = await this.initializeClient();
    const config = await this.configManager.getProviderConfig(this.name);
    
    if (!config) {
      throw new Error('Azure provider configuration not found');
    }
    
    try {
      const containerGroupName = instanceId.includes('-cg') ? instanceId : `${instanceId}-cg`;
      await client.containerGroups.beginDeleteAndWait(config.resourceGroup, containerGroupName);
    } catch (error) {
      throw new Error(`Failed to destroy Azure ACI container: ${error}`);
    }
  }

  async getInstanceUrl(instanceId: string): Promise<string | undefined> {
    const client = await this.initializeClient();
    const config = await this.configManager.getProviderConfig(this.name);
    
    if (!config) {
      throw new Error('Azure provider configuration not found');
    }
    
    try {
      const containerGroupName = instanceId.includes('-cg') ? instanceId : `${instanceId}-cg`;
      const containerGroup = await client.containerGroups.get(config.resourceGroup, containerGroupName);
      return this.getContainerUrl(containerGroup);
    } catch (error) {
      throw new Error(`Failed to get Azure ACI container URL: ${error}`);
    }
  }

  async getInstanceStatus(instanceId: string): Promise<SandboxInstance['status']> {
    const client = await this.initializeClient();
    const config = await this.configManager.getProviderConfig(this.name);
    
    if (!config) {
      throw new Error('Azure provider configuration not found');
    }
    
    try {
      const containerGroupName = instanceId.includes('-cg') ? instanceId : `${instanceId}-cg`;
      const containerGroup = await client.containerGroups.get(config.resourceGroup, containerGroupName);
      return this.mapAzureStatus(containerGroup.instanceView?.state);
    } catch (error) {
      throw new Error(`Failed to get Azure ACI container status: ${error}`);
    }
  }

  private async buildAndPushImage(options: DeploymentOptions, imageName: string): Promise<string> {
    const config = await this.configManager.getProviderConfig(this.name);
    if (!config || !config.containerRegistry) {
      throw new Error('Azure Container Registry not configured');
    }

    const folderPath = path.resolve(options.folder);
    const dockerfilePath = path.resolve(options.dockerfile);
    
    if (!await fs.pathExists(folderPath) || !await fs.pathExists(dockerfilePath)) {
      throw new Error('Folder or Dockerfile not found');
    }

    // Check Docker prerequisites
    if (!await DockerUtils.checkDockerInstalled()) {
      throw new Error('Docker is not installed. Please install Docker to build images.');
    }

    if (!await DockerUtils.checkDockerRunning()) {
      throw new Error('Docker is not running. Please start Docker daemon.');
    }

    const registryUrl = `${config.containerRegistry}.azurecr.io`;
    const imageTag = `${registryUrl}/${imageName}:${Date.now()}`;
    
    try {
      console.log('Authenticating with Azure Container Registry...');
      await this.authenticateWithACR(config);
      
      console.log('Building Docker image...');
      await DockerUtils.buildImage(imageTag, dockerfilePath, folderPath);
      
      console.log('Pushing image to Azure Container Registry...');
      await DockerUtils.pushImage(imageTag);
      
      console.log(`Image pushed successfully: ${imageTag}`);
      return imageTag;
      
    } catch (error) {
      throw new Error(`Failed to build and push Docker image: ${error}`);
    }
  }

  private async validateAzurePrerequisites(): Promise<void> {
    // Check if Azure CLI is installed
    if (!await AzureUtils.checkAzureCLIInstalled()) {
      throw new Error(AzureUtils.getAzureCLIInstallMessage());
    }

    // Check if user is logged in to Azure CLI (only if no service principal is configured)
    const config = await this.configManager.getProviderConfig(this.name);
    if (!config || !(config.tenantId && config.clientId && config.clientSecret)) {
      if (!await AzureUtils.checkAzureCLILoggedIn()) {
        throw new Error(AzureUtils.getAzureCLILoginMessage());
      }
    }
  }

  private async getImageRegistryCredentials(config: any): Promise<any[]> {
    const registryServer = `${config.containerRegistry}.azurecr.io`;
    
    if (config.tenantId && config.clientId && config.clientSecret) {
      // Use service principal credentials
      return [
        {
          server: registryServer,
          username: config.clientId,
          password: config.clientSecret
        }
      ];
    } else {
      // Use Azure CLI to get ACR access token
      try {
        const { stdout } = await import('child_process').then(cp => 
          new Promise<{stdout: string}>((resolve, reject) => {
            cp.exec(`az acr credential show --name ${config.containerRegistry} --query "passwords[0].value" -o tsv`, 
              (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve({ stdout });
              });
          })
        );
        
        const password = stdout.trim();
        
        return [
          {
            server: registryServer,
            username: config.containerRegistry,
            password: password
          }
        ];
      } catch (error) {
        throw new Error(`Failed to get ACR admin credentials. Enable admin user on your ACR or provide service principal credentials: ${error}`);
      }
    }
  }

  private async authenticateWithACR(config: any): Promise<void> {
    try {
      // Try service principal authentication first if credentials are provided
      if (config.tenantId && config.clientId && config.clientSecret) {
        console.log('Using service principal authentication for ACR...');
        const registryUrl = `${config.containerRegistry}.azurecr.io`;
        await DockerUtils.loginToRegistry(registryUrl, config.clientId, config.clientSecret);
      } else {
        // Fall back to Azure CLI authentication
        console.log('Using Azure CLI authentication for ACR...');
        await DockerUtils.azureCliLogin(config.containerRegistry);
      }
    } catch (error) {
      throw new Error(`Failed to authenticate with Azure Container Registry: ${error}`);
    }
  }

  private getContainerUrl(containerGroup: any): string | undefined {
    if (containerGroup.ipAddress?.ip) {
      const port = containerGroup.ipAddress?.ports?.[0]?.port || 8080;
      return `http://${containerGroup.ipAddress.ip}:${port}`;
    }
    return undefined;
  }

  // New methods for split workflow
  async createSandbox(options: CreateSandboxOptions): Promise<SandboxInstance> {
    // Validate Azure prerequisites before creation
    await this.validateAzurePrerequisites();
    
    const client = await this.initializeClient();
    const config = await this.configManager.getProviderConfig(this.name);
    
    if (!config) {
      throw new Error('Azure provider configuration not found');
    }
    
    // Generate unique identifiers
    const instanceId = this.generateInstanceId();
    const instanceName = this.generateInstanceName(options.folder);
    const containerGroupName = `${instanceName}-cg`;
    
    const instance: SandboxInstance = {
      id: containerGroupName, // Use container group name as ID for Azure
      name: instanceName,
      status: SandboxStatus.CREATING,
      provider: this.name,
      createdAt: new Date()
    };

    try {
      // Build Docker image and push to registry (base image)
      const imageUri = await this.buildAndPushImage({
        folder: options.folder,
        dockerfile: options.dockerfile,
        name: options.name
      }, containerGroupName);
      
      // Create container group configuration with registry credentials
      const containerGroupSpec = {
        location: config.location || 'eastus',
        containers: [
          {
            name: instanceName,
            image: imageUri,
            resources: {
              requests: {
                cpu: 1,
                memoryInGB: 1.5
              }
            },
            ports: [
              {
                protocol: 'TCP',
                port: 8080
              }
            ],
            environmentVariables: [
              {
                name: 'NODE_ENV',
                value: 'production'
              },
              {
                name: 'PORT',
                value: '8080'
              }
            ]
          }
        ],
        osType: 'Linux',
        imageRegistryCredentials: await this.getImageRegistryCredentials(config),
        ipAddress: {
          type: 'Public',
          ports: [
            {
              protocol: 'TCP',
              port: 8080
            }
          ]
        },
        restartPolicy: 'OnFailure'
      };

      // Create container group (but don't wait for full deployment)
      await client.containerGroups.beginCreateOrUpdate(
        config.resourceGroup,
        containerGroupName,
        containerGroupSpec
      );

      // Update instance status to ready (container group created, image built)
      instance.status = SandboxStatus.READY;
      
      return instance;

    } catch (error) {
      instance.status = SandboxStatus.ERROR;
      throw new Error(`Azure ACI sandbox creation failed: ${error}`);
    }
  }

  async deployToSandbox(sandboxId: string, options: DeployOptions): Promise<DeploymentResult> {
    const client = await this.initializeClient();
    const config = await this.configManager.getProviderConfig(this.name);
    
    if (!config) {
      throw new Error('Azure provider configuration not found');
    }
    
    try {
      const containerGroupName = sandboxId.includes('-cg') ? sandboxId : `${sandboxId}-cg`;
      
      // Build new image with updated code
      let imageUri: string;
      if (options.dockerfile) {
        // Full rebuild with new Dockerfile
        imageUri = await this.buildAndPushImage({
          folder: options.folder,
          dockerfile: options.dockerfile
        }, `${containerGroupName}-${Date.now()}`);
      } else {
        // Incremental update - build new image with same Dockerfile
        const existingGroup = await client.containerGroups.get(config.resourceGroup, containerGroupName);
        const baseName = containerGroupName.replace('-cg', '');
        imageUri = await this.buildAndPushImage({
          folder: options.folder,
          dockerfile: path.join(options.folder, 'Dockerfile') // Assume Dockerfile in folder
        }, `${baseName}-${Date.now()}`);
      }
      
      // Update container group with new image
      const existingGroup = await client.containerGroups.get(config.resourceGroup, containerGroupName);
      
      if (existingGroup.containers && existingGroup.containers.length > 0) {
        existingGroup.containers[0].image = imageUri;
        
        // Update the container group
        const deploymentResult = await client.containerGroups.beginCreateOrUpdateAndWait(
          config.resourceGroup,
          containerGroupName,
          existingGroup
        );
        
        const instance: SandboxInstance = {
          id: containerGroupName,
          name: containerGroupName.replace('-cg', ''),
          status: SandboxStatus.DEPLOYED,
          provider: this.name,
          createdAt: new Date(Date.now()),
          url: this.getContainerUrl(deploymentResult)
        };

        return {
          instance,
          logs: [
            'New container image built and pushed',
            'Container group updated with new image',
            'Application redeployed successfully'
          ]
        };
      } else {
        throw new Error('Container group has no containers to update');
      }

    } catch (error) {
      throw new Error(`Azure ACI deployment to sandbox failed: ${error}`);
    }
  }

  async getSandbox(sandboxId: string): Promise<SandboxInstance> {
    const client = await this.initializeClient();
    const config = await this.configManager.getProviderConfig(this.name);
    
    if (!config) {
      throw new Error('Azure provider configuration not found');
    }
    
    try {
      const containerGroupName = sandboxId.includes('-cg') ? sandboxId : `${sandboxId}-cg`;
      const containerGroup = await client.containerGroups.get(config.resourceGroup, containerGroupName);
      
      return {
        id: containerGroup.name || sandboxId,
        name: containerGroup.name?.replace('-cg', '') || 'Unknown',
        status: this.mapAzureStatus(containerGroup.instanceView?.state),
        provider: this.name,
        createdAt: new Date(Date.now()),
        url: this.getContainerUrl(containerGroup)
      };

    } catch (error) {
      throw new Error(`Failed to get Azure ACI sandbox: ${error}`);
    }
  }

  // New methods for command execution
  async executeCommand(sandboxId: string, options: ExecuteOptions): Promise<ExecuteResult> {
    const client = await this.initializeClient();
    const config = await this.configManager.getProviderConfig(this.name);
    
    if (!config) {
      throw new Error('Azure provider configuration not found');
    }
    
    try {
      const containerGroupName = sandboxId.includes('-cg') ? sandboxId : `${sandboxId}-cg`;
      const containerGroup = await client.containerGroups.get(config.resourceGroup, containerGroupName);
      
      if (!containerGroup.containers || containerGroup.containers.length === 0) {
        throw new Error('No containers found in the container group');
      }
      
      const containerName = containerGroup.containers[0].name;
      if (!containerName) {
        throw new Error('Container name not found');
      }
      
      const startTime = Date.now();
      
      // For Azure Container Instances, we need to use the exec API
      // This is a simplified implementation - Azure ACI exec support is limited
      // In practice, you might need to use Azure Container Instance's exec API
      // or implement a workaround using container restart with command override
      
      // Note: Azure Container Instances has limited exec support
      // This is a placeholder implementation that would need Azure Container Instance exec API
      throw new Error('Command execution in Azure Container Instances is not fully supported yet. Consider using Daytona provider for interactive command execution.');
      
    } catch (error) {
      throw new Error(`Azure ACI command execution failed: ${error}`);
    }
  }
  
  supportsExecution(): boolean {
    // Azure Container Instances has limited exec support
    return false;
  }

  private mapAzureStatus(azureState: string | undefined): SandboxInstance['status'] {
    switch (azureState?.toLowerCase()) {
      case 'running':
        return 'running';
      case 'pending':
      case 'waiting':
        return 'creating';
      case 'succeeded':
        return 'stopped';
      case 'failed':
        return 'error';
      case 'terminated':
        return 'stopped';
      default:
        return 'creating';
    }
  }
}