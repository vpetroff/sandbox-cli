import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export class DockerUtils {
  
  static async checkDockerInstalled(): Promise<boolean> {
    try {
      await execAsync('docker --version');
      return true;
    } catch {
      return false;
    }
  }

  static async checkDockerRunning(): Promise<boolean> {
    try {
      await execAsync('docker info');
      return true;
    } catch {
      return false;
    }
  }

  static async validateDockerfile(dockerfilePath: string): Promise<boolean> {
    try {
      // Basic validation - check if we can parse the Dockerfile
      await execAsync(`docker build --platform=linux/amd64 --dry-run -f ${dockerfilePath} .`);
      return true;
    } catch {
      return false;
    }
  }

  static async buildImage(imageName: string, dockerfilePath: string, contextPath: string): Promise<void> {
    const buildCommand = `docker build --platform=linux/amd64 -t ${imageName} -f ${dockerfilePath} ${contextPath}`;
    
    try {
      const { stdout, stderr } = await execAsync(buildCommand);
      if (stderr && !stderr.includes('SECURITY WARNING')) {
        console.log('Build warnings:', stderr);
      }
      console.log('Build output:', stdout);
    } catch (error: any) {
      throw new Error(`Docker build failed: ${error.message}`);
    }
  }

  static async pushImage(imageName: string): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync(`docker push ${imageName}`);
      if (stderr) {
        console.log('Push output:', stderr);
      }
      console.log('Push completed:', stdout);
    } catch (error: any) {
      throw new Error(`Docker push failed: ${error.message}`);
    }
  }

  static async loginToRegistry(registryUrl: string, username: string, password: string): Promise<void> {
    try {
      await execAsync(`echo "${password}" | docker login ${registryUrl} -u ${username} --password-stdin`);
    } catch (error: any) {
      throw new Error(`Docker registry login failed: ${error.message}`);
    }
  }

  static async azureCliLogin(registryName: string): Promise<void> {
    try {
      await execAsync(`az acr login --name ${registryName}`);
    } catch (error: any) {
      throw new Error(`Azure CLI ACR login failed: ${error.message}`);
    }
  }
}