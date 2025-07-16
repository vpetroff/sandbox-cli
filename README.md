# Sandbox CLI

A powerful command-line tool for deploying applications to sandbox environments. Deploy your code with a single command to cloud development environments like Daytona, E2B, or Azure Container Instances.

## ✨ Features

- 🚀 **One-Command Deployment** - Deploy any Dockerized application instantly
- 🔧 **Multiple Providers** - Support for Daytona, E2B, and Azure Container Instances
- 🐳 **Docker Integration** - Automatic image building and registry management
- 🔐 **Secure Authentication** - Service principal and CLI-based authentication
- 📋 **Sandbox Management** - List, browse, and destroy running sandboxes
- 🌐 **Direct Access** - Automatic URL generation for deployed applications
- ⚡ **Command Execution** - Run commands directly in sandbox environments

## 🚀 Quick Start

### Installation

```bash
git clone <repository-url>
cd sandbox-cli
npm install
npm run build
```

### Initialize Configuration

```bash
npm run cli init
```

### Configure a Provider

```bash
# Configure Daytona
npm run cli configure daytona

# Configure Azure Container Instances
npm run cli configure azure

# Configure E2B (coming soon)
npm run cli configure e2b
```

### Create and Deploy Your Application

```bash
# Create a sandbox environment
npm run cli create ./my-app --provider daytona

# Deploy code to the current sandbox
npm run cli deploy ./my-app

# Or create with Azure
npm run cli create ./my-app --provider azure
npm run cli deploy ./my-app
```

## 📖 Provider Setup

### Daytona

**Prerequisites:**
- Daytona account and API key
- Daytona server access

**Configuration:**
```bash
npm run cli configure daytona
```

You'll be prompted for:
- API Key (from Daytona dashboard)
- Server URL (default: https://app.daytona.io/api)
- Target region (default: eu)

### Azure Container Instances

**Prerequisites:**
- Azure subscription
- Azure CLI installed and configured
- Azure Container Registry
- Resource group

**Setup:**
```bash
# Install Azure CLI (if not already installed)
# macOS: brew install azure-cli
# Windows: Download from https://aka.ms/installazurecliwindows
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Create resource group (if needed)
az group create --name sandbox-rg --location eastus

# Create Azure Container Registry (if needed)
az acr create --resource-group sandbox-rg --name myregistry --sku Basic --admin-enabled true
```

**Configuration:**
```bash
npm run cli configure azure
```

You'll be prompted for:
- Subscription ID (required)
- Resource Group name (required)
- Azure region (default: eastus)
- Container Registry name (required)
- Service Principal credentials (optional)

### E2B

Coming soon! E2B provider implementation is planned.

## 🎯 Usage

### Create a Sandbox Environment

```bash
# Create sandbox with default provider
npm run cli create ./my-app

# Create sandbox with specific provider
npm run cli create ./my-app --provider azure

# Create sandbox with custom Dockerfile
npm run cli create ./my-app --dockerfile ./custom.Dockerfile
```

### Deploy Code to Current Sandbox

```bash
# Deploy to current sandbox
npm run cli deploy ./my-app

# Deploy with custom Dockerfile (optional for updates)
npm run cli deploy ./my-app --dockerfile ./custom.Dockerfile
```

### Manage Sandboxes

```bash
# List all sandboxes (current one highlighted)
npm run cli list

# Select current sandbox
npm run cli select

# Open sandbox in browser
npm run cli browse <sandbox-id>

# Destroy a sandbox
npm run cli destroy <sandbox-id>
```

### Execute Commands in Sandboxes

Run commands directly in your deployed sandbox environments without needing to access them through other means:

```bash
# Execute basic commands
npm run cli execute "ls -la"
npm run cli execute "pwd"
npm run cli execute "npm install"

# Execute commands with custom working directory
npm run cli execute "ls" --cwd /workspaces/project/src

# Execute long-running commands with custom timeout
npm run cli execute "npm run build" --timeout 600

# Execute commands without real-time streaming (get all output at once)
npm run cli execute "cat package.json" --no-stream
```

**Common Use Cases:**
- **Development tasks**: `npm run cli execute "npm install"`, `npm run cli execute "npm run build"`
- **File operations**: `npm run cli execute "ls -la"`, `npm run cli execute "cat config.json"`
- **Process management**: `npm run cli execute "ps aux"`, `npm run cli execute "top"`
- **Git operations**: `npm run cli execute "git status"`, `npm run cli execute "git log --oneline"`
- **System diagnostics**: `npm run cli execute "df -h"`, `npm run cli execute "free -m"`

**Command Options:**
- `--cwd <directory>` - Set working directory (default: `/workspaces/project`)
- `--timeout <seconds>` - Set command timeout (default: 300 seconds)
- `--no-stream` - Disable real-time output streaming

**Provider Support:**
- ✅ **Daytona** - Full command execution support with real-time streaming
- ✅ **Azure Container Instances** - Full command execution support with real-time streaming
- ❌ **E2B** - Coming soon

### Provider-Specific Command Execution Details

#### Daytona Provider
**Capabilities:**
- ✅ Real-time output streaming
- ✅ Working directory support
- ✅ Command timeout handling
- ✅ Signal interruption (Ctrl+C)
- ✅ Exit code preservation
- ✅ Both stdout and stderr capture

**Limitations:**
- Commands run with workspace user permissions
- Interactive commands requiring input may not work as expected
- Some system-level commands may be restricted based on workspace configuration
- Network access depends on Daytona workspace network policies

**Best Practices:**
- Use absolute paths or paths relative to `/workspaces/project`
- For long-running processes, consider using `screen` or `tmux` within the command
- Test commands in Daytona's web terminal first if unsure

#### Azure Container Instances Provider
**Capabilities:**
- ✅ Real-time output streaming via Azure exec API
- ✅ Working directory support
- ✅ Command timeout handling
- ✅ Signal interruption (Ctrl+C)
- ✅ Exit code preservation
- ✅ Both stdout and stderr capture

**Limitations:**
- Commands run with container's default user (usually root)
- Container must be in "Running" state for command execution
- Network access limited to container's network configuration
- Some Azure regions may have exec API limitations
- Container restart will terminate any running commands

**Best Practices:**
- Verify container status before executing long-running commands
- Use `--timeout` for commands that might hang
- Consider container resource limits for memory/CPU intensive operations
- Check Azure Container Instance logs if commands fail unexpectedly

#### E2B Provider (Coming Soon)
**Planned Capabilities:**
- Real-time output streaming
- Working directory support
- Command timeout handling
- Secure sandboxed execution environment

**Note:** E2B provider implementation is in development. Command execution will be available in a future release.

### Command Execution Examples

Here are practical examples for common development scenarios:

#### Development Workflow
```bash
# Install dependencies after deploying new code
npm run cli execute "npm install"

# Run build process
npm run cli execute "npm run build"

# Run tests
npm run cli execute "npm test"

# Check application logs
npm run cli execute "tail -f /var/log/app.log" --timeout 60

# Restart application service
npm run cli execute "pm2 restart app"
```

#### Debugging and Diagnostics
```bash
# Check running processes
npm run cli execute "ps aux | grep node"

# Monitor system resources
npm run cli execute "top -n 1"

# Check disk usage
npm run cli execute "df -h"

# Check memory usage
npm run cli execute "free -m"

# View environment variables
npm run cli execute "env | grep NODE"

# Check network connections
npm run cli execute "netstat -tulpn"
```

#### File Operations
```bash
# List project files
npm run cli execute "find /workspaces/project -type f -name '*.js' | head -10"

# Check file contents
npm run cli execute "cat /workspaces/project/package.json"

# Search for text in files
npm run cli execute "grep -r 'TODO' /workspaces/project/src"

# Check file permissions
npm run cli execute "ls -la /workspaces/project"

# Create backup of important files
npm run cli execute "tar -czf backup.tar.gz /workspaces/project/config"
```

#### Git Operations
```bash
# Check git status
npm run cli execute "git status" --cwd /workspaces/project

# View recent commits
npm run cli execute "git log --oneline -10" --cwd /workspaces/project

# Check current branch
npm run cli execute "git branch" --cwd /workspaces/project

# Pull latest changes (if git is configured)
npm run cli execute "git pull origin main" --cwd /workspaces/project
```

#### Database Operations
```bash
# Connect to database and run query
npm run cli execute "mysql -u user -p database -e 'SHOW TABLES;'"

# Check database connection
npm run cli execute "pg_isready -h localhost -p 5432"

# Run database migrations
npm run cli execute "npm run db:migrate"

# Seed database with test data
npm run cli execute "npm run db:seed"
```

#### Container and Service Management
```bash
# Check Docker containers (if Docker-in-Docker is available)
npm run cli execute "docker ps"

# Check service status
npm run cli execute "systemctl status nginx"

# View service logs
npm run cli execute "journalctl -u myapp -n 50"

# Restart a service
npm run cli execute "sudo systemctl restart nginx"
```

### Typical Workflow

```bash
# 1. Create sandbox once
npm run cli create ./my-app --provider daytona

# 2. Make code changes and deploy iteratively
npm run cli deploy ./my-app
# ... make changes ...
npm run cli deploy ./my-app

# 3. Switch between projects
npm run cli select  # choose different sandbox
npm run cli deploy ./other-project
```

### Set Default Provider

```bash
npm run cli init
# Select your preferred default provider
```

## 📁 Application Requirements

Your application folder must contain:

1. **Dockerfile** - Defines how to build your application
2. **Application code** - Your source code files
3. **Dependencies** - Package files (package.json, requirements.txt, etc.)

**Example Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
```

## 🔧 Configuration

Configuration is stored in `~/.sandbox-cli/config.json`:

```json
{
  "defaultProvider": "daytona",
  "providers": {
    "daytona": {
      "apiKey": "your-api-key",
      "serverUrl": "https://app.daytona.io/api",
      "target": "eu"
    },
    "azure": {
      "subscriptionId": "your-subscription-id",
      "resourceGroup": "sandbox-rg",
      "location": "eastus",
      "containerRegistry": "myregistry"
    }
  }
}
```

## 🛠️ Development

### Build and Test

```bash
# Build TypeScript
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Clean build directory
npm run clean
```

### Development Commands

```bash
# Run in development mode
npm run dev

# Build and run CLI
npm run cli -- <command>
```

## 🔍 Troubleshooting

### Azure Issues

**"Azure CLI not found"**
- Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
- Run `az login` to authenticate

**"Not logged in to Azure"**
```bash
az login
az account set --subscription <your-subscription-id>
```

**"Container registry not accessible"**
- Ensure admin user is enabled: `az acr update --name <registry> --admin-enabled true`
- Or provide service principal credentials during configuration

**"Docker not running"**
- Start Docker Desktop or Docker daemon
- Verify with `docker info`

### Daytona Issues

**"Invalid API key"**
- Get a new API key from Daytona dashboard
- Reconfigure: `npm run cli configure daytona`

**"Sandbox creation failed"**
- Check Daytona server status
- Verify your Daytona subscription limits

### Command Execution Issues

**"No current sandbox selected"**
- Run `npm run cli select` to choose an active sandbox
- Or create a new sandbox with `npm run cli create <folder>`

**"Provider does not support command execution"**
- Currently supported: Daytona, Azure Container Instances
- E2B support coming soon
- Check provider documentation for limitations

**"Sandbox is not running"**
- Verify sandbox status with `npm run cli list`
- Restart sandbox through provider's interface
- For Azure: Check container instance status in Azure portal
- For Daytona: Check workspace status in Daytona dashboard

**"Command timeout"**
- Increase timeout: `npm run cli execute "command" --timeout 600`
- For very long operations, consider running in background
- Check if command is hanging or waiting for input

**"Permission denied"**
- Commands run with sandbox's default user permissions
- Some system commands may require elevated privileges
- Try alternative commands or check sandbox configuration

**"Working directory not found"**
- Verify directory exists: `npm run cli execute "ls -la /path"`
- Use absolute paths or paths relative to `/workspaces/project`
- Check if project was properly deployed to sandbox

**"Command execution failed"**
- Check command syntax and arguments
- Verify required tools/packages are installed in sandbox
- Review error output for specific issues
- Test command locally first if possible

**"Output not streaming"**
- Some commands may buffer output
- Try `--no-stream` flag to get all output at once
- Check if command produces output (try with `echo "test"`)

### General Issues

**"Dockerfile not found"**
- Ensure Dockerfile exists in your project
- Use `--dockerfile` flag to specify custom path

**"Build failed"**
- Check Dockerfile syntax
- Ensure all dependencies are available
- Review build logs for specific errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- Check the troubleshooting section above
- Review configuration in `~/.sandbox-cli/config.json`
- Check provider-specific documentation
- Open an issue for bugs or feature requests
