# Sandbox CLI

A powerful command-line tool for deploying applications to sandbox environments. Deploy your code with a single command to cloud development environments like Daytona, E2B, or Azure Container Instances.

## ✨ Features

- 🚀 **One-Command Deployment** - Deploy any Dockerized application instantly
- 🔧 **Multiple Providers** - Support for Daytona, E2B, and Azure Container Instances
- 🐳 **Docker Integration** - Automatic image building and registry management
- 🔐 **Secure Authentication** - Service principal and CLI-based authentication
- 📋 **Sandbox Management** - List, browse, and destroy running sandboxes
- 🌐 **Direct Access** - Automatic URL generation for deployed applications

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

## 🔄 Migration Guide

If you were using the previous single `deploy` command, here's how to migrate to the new split workflow:

### Old Workflow (Deprecated)
```bash
# This created and deployed in one step
npm run cli deploy ./my-app --provider azure
```

### New Workflow (Recommended)
```bash
# 1. Create sandbox once
npm run cli create ./my-app --provider azure

# 2. Deploy code iteratively
npm run cli deploy ./my-app
# ... make changes ...
npm run cli deploy ./my-app  # Much faster subsequent deployments!
```

### Benefits of New Workflow
- **Faster iterations**: Deploy code changes without recreating infrastructure
- **Better resource management**: Reuse sandbox environments
- **Clearer separation**: Infrastructure setup vs. code deployment
- **Multi-project support**: Switch between different sandboxes easily

### Key Differences
- `create` replaces the infrastructure setup part of the old `deploy`
- New `deploy` only handles code updates to existing sandboxes
- `select` command lets you switch between multiple sandbox environments
- `list` command shows which sandbox is currently active

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