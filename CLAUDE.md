# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sandbox CLI is a TypeScript/Node.js application for deploying Dockerized applications to cloud sandbox environments. It supports multiple providers (Daytona, Azure Container Instances) with a unified CLI interface.

**Technology Stack:**
- TypeScript/Node.js
- Commander.js for CLI parsing
- Inquirer.js for interactive prompts
- Azure SDK (@azure/arm-containerinstance, @azure/identity)
- Daytona SDK (@daytonaio/sdk)
- Docker integration for image building

## Common Commands

```bash
# Development
npm run dev          # Run in development mode with ts-node
npm run build        # Build TypeScript to JavaScript
npm run test         # Run Jest tests
npm run lint         # Run ESLint
npm run clean        # Clean dist directory

# CLI Usage
npm run cli init                              # Initialize CLI configuration
npm run cli configure <provider>             # Configure sandbox provider
npm run cli deploy <folder> --provider <p>   # Deploy folder to sandbox
npm run cli list                             # List active sandboxes
npm run cli browse <sandbox-id>              # Open deployed app in browser
npm run cli destroy <sandbox-id>             # Cleanup sandbox
```

## Architecture

```
src/
├── cli/
│   ├── commands/      # Command implementations (init, deploy, list, etc.)
│   ├── prompts/       # Interactive configuration prompts
│   └── index.ts       # Main CLI entry point with Commander.js
├── providers/
│   ├── base.ts        # Abstract provider interface
│   ├── daytona.ts     # Daytona implementation using @daytonaio/sdk
│   ├── azure-aci.ts   # Azure Container Instances implementation
│   └── index.ts       # Provider factory
├── core/
│   └── config.ts      # Configuration management (~/.sandbox-cli/config.json)
└── utils/
    ├── docker.ts      # Docker utilities (build, push, validation)
    └── azure.ts       # Azure CLI validation utilities
```

## Configuration

CLI stores configuration in `~/.sandbox-cli/config.json`:

```json
{
  "defaultProvider": "daytona",
  "providers": {
    "daytona": {
      "apiKey": "...",
      "serverUrl": "https://app.daytona.io/api",
      "target": "eu"
    },
    "azure": {
      "subscriptionId": "...",
      "resourceGroup": "...",
      "location": "eastus",
      "containerRegistry": "myregistry",
      "tenantId": "...",     // Optional for service principal
      "clientId": "...",     // Optional for service principal  
      "clientSecret": "..."  // Optional for service principal
    }
  }
}
```

## Provider Implementations

### Base Provider Interface (`src/providers/base.ts`)
All providers implement:
- `configure()` - Setup provider
- `isConfigured()` - Check if provider is ready
- `deploy(options)` - Deploy application
- `list()` - List active sandboxes
- `destroy(id)` - Remove sandbox
- `getInstanceUrl(id)` - Get sandbox URL
- `getInstanceStatus(id)` - Get sandbox status

### Daytona Provider (`src/providers/daytona.ts`)
- Uses `@daytonaio/sdk` for API communication
- Creates sandboxes from Dockerfile using `Image.fromDockerfile()`
- Handles workspace creation and file operations
- Provides preview URLs for deployed applications

### Azure Provider (`src/providers/azure-aci.ts`)
- Uses `@azure/arm-containerinstance` for ACI management
- Builds Docker images and pushes to Azure Container Registry
- Creates container groups with proper ACR credentials
- Supports both service principal and Azure CLI authentication
- Validates Azure CLI availability and login status

## Docker Integration

The `src/utils/docker.ts` utility provides:
- Docker installation/daemon checks
- Cross-platform image building (linux/amd64)
- Registry authentication (ACR, service principal)
- Image push operations with error handling

## Key Features

1. **Multi-Provider Support** - Unified interface for different sandbox providers
2. **Docker Integration** - Automatic image building and registry management
3. **Authentication Flexibility** - Service principal, CLI, and API key auth
4. **Prerequisites Validation** - Checks for Docker, Azure CLI, and other requirements
5. **Error Handling** - Comprehensive error messages with troubleshooting guidance
6. **Configuration Management** - Persistent provider configuration with validation

## Development Notes

- All providers use the same base interface for consistency
- Docker builds use `--platform=linux/amd64` for cloud compatibility
- Azure provider requires admin-enabled ACR or service principal credentials
- Daytona uses dynamic image creation from Dockerfile context
- Configuration validation happens at provider initialization
- Each deployment generates unique container/sandbox names with timestamps

## Testing

Test deployments using the included test-app:
```bash
npm run cli deploy test-app --provider daytona
npm run cli deploy test-app --provider azure --dockerfile test-app/Dockerfile
```

The test app is a simple Express.js application that responds with JSON and includes health endpoints.