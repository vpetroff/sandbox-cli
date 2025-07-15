# Design Document

## Overview

This design splits the current monolithic `deploy` command into two distinct operations: `create` and `deploy`. The `create` command establishes a sandbox environment and builds the base container image, while the `deploy` command handles iterative code updates to an existing sandbox. A new `select` command manages the current active sandbox, and the `list` command is enhanced to show the current selection.

The design maintains the existing provider architecture while extending it to support persistent sandbox management and incremental deployments.

## Architecture

### Command Structure

The new command structure replaces the single `deploy` command with:

- `create <folder>` - Creates a new sandbox environment
- `deploy <folder>` - Deploys code to the current sandbox  
- `select` - Selects the current active sandbox
- `list` - Lists all sandboxes (highlighting current)
- Existing commands remain: `browse`, `destroy`, `configure`, `init`

### State Management

The system introduces persistent state management to track:

- **Current Sandbox Selection**: Stored in config as `currentSandbox`
- **Sandbox Metadata**: Enhanced sandbox instances with deployment history
- **Provider State**: Extended to support sandbox lifecycle management

### Provider Interface Extensions

The `BaseSandboxProvider` interface is extended with new methods:

```typescript
abstract class BaseSandboxProvider {
  // Existing methods...
  abstract deploy(options: DeploymentOptions): Promise<DeploymentResult>;
  
  // New methods for split workflow
  abstract createSandbox(options: CreateSandboxOptions): Promise<SandboxInstance>;
  abstract deployToSandbox(sandboxId: string, options: DeployOptions): Promise<DeploymentResult>;
  abstract getSandbox(sandboxId: string): Promise<SandboxInstance>;
}
```

## Components and Interfaces

### New Interfaces

```typescript
interface CreateSandboxOptions {
  folder: string;
  dockerfile: string;
  name?: string;
  provider?: string;
}

interface DeployOptions {
  folder: string;
  dockerfile?: string; // Optional for incremental updates
}

interface SandboxMetadata {
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
```

### Enhanced Config Structure

```typescript
interface Config {
  defaultProvider?: string;
  currentSandbox?: string; // New: tracks selected sandbox
  providers: {
    [providerName: string]: ProviderConfig;
  };
  sandboxes?: { // New: local sandbox metadata cache
    [sandboxId: string]: SandboxMetadata;
  };
}
```

### Command Implementations

#### Create Command (`src/cli/commands/create.ts`)

1. **Validation**: Verify folder exists and contains Dockerfile
2. **Provider Selection**: Use specified provider or default
3. **Sandbox Creation**: Call provider's `createSandbox()` method
4. **State Update**: Store sandbox metadata and set as current
5. **Feedback**: Display sandbox ID, URL, and next steps

#### Deploy Command (`src/cli/commands/deploy.ts`)

1. **Current Sandbox Check**: Verify a sandbox is selected
2. **Validation**: Ensure sandbox exists and is accessible
3. **Code Deployment**: Call provider's `deployToSandbox()` method
4. **State Update**: Update deployment timestamp and count
5. **Feedback**: Show deployment status and application URL

#### Select Command (`src/cli/commands/select.ts`)

1. **Sandbox Discovery**: List all available sandboxes across providers
2. **Interactive Selection**: Present numbered list for user choice
3. **State Update**: Set selected sandbox as current
4. **Confirmation**: Display which sandbox is now active

#### Enhanced List Command

1. **Multi-Provider Listing**: Query all configured providers
2. **Current Highlighting**: Visually distinguish the current sandbox
3. **Status Display**: Show sandbox state, deployment count, last deployed
4. **Provider Grouping**: Organize output by provider

## Data Models

### Sandbox Lifecycle States

- **Creating**: Sandbox is being provisioned
- **Ready**: Sandbox exists but no code deployed
- **Deployed**: Code successfully deployed and running
- **Error**: Sandbox or deployment failed
- **Destroyed**: Sandbox has been cleaned up

### Provider-Specific Implementations

Each provider implements the split workflow differently:

**Daytona Provider**:
- `createSandbox()`: Creates workspace, builds base image
- `deployToSandbox()`: Syncs files to existing workspace

**Azure Container Instances Provider**:
- `createSandbox()`: Creates resource group, builds/pushes base image
- `deployToSandbox()`: Updates container with new image version

## Error Handling

### Create Command Errors

- **Folder not found**: Clear path resolution error
- **Dockerfile missing**: Specific file location guidance  
- **Provider not configured**: Configuration command suggestion
- **Sandbox creation failed**: Provider-specific error details
- **Resource conflicts**: Name collision resolution

### Deploy Command Errors

- **No current sandbox**: Prompt to run `select` command
- **Sandbox not found**: Suggest running `list` to verify
- **Sandbox not ready**: Display current status and wait options
- **Deployment failed**: Rollback options and error logs
- **Connection issues**: Retry mechanisms and timeout handling

### Select Command Errors

- **No sandboxes available**: Suggest running `create` command
- **Provider unavailable**: Skip with warning, continue with others
- **Invalid selection**: Re-prompt with valid options

## Testing Strategy

### Unit Tests

- **Command Logic**: Test each command's core functionality
- **Config Management**: Verify state persistence and retrieval
- **Provider Interface**: Mock provider implementations
- **Error Scenarios**: Comprehensive error condition coverage

### Integration Tests

- **End-to-End Workflow**: Create → Select → Deploy → List cycle
- **Provider Compatibility**: Test with each supported provider
- **State Consistency**: Verify config updates across commands
- **Cross-Platform**: Test on different operating systems

### Manual Testing Scenarios

1. **New User Workflow**: Fresh installation through first deployment
2. **Multi-Sandbox Management**: Creating and switching between sandboxes
3. **Error Recovery**: Handling failed operations gracefully
4. **Provider Migration**: Moving sandboxes between providers
5. **Concurrent Usage**: Multiple CLI instances accessing same config

### Performance Considerations

- **Sandbox Listing**: Cache provider responses for faster `list` operations
- **File Synchronization**: Implement incremental sync for large applications
- **Provider Polling**: Efficient status checking without overwhelming APIs
- **Config I/O**: Minimize file system operations during normal usage

### Security Considerations

- **Credential Storage**: Maintain existing secure provider credential handling
- **Sandbox Isolation**: Ensure sandboxes cannot access each other's data
- **File Transfer**: Validate file paths to prevent directory traversal
- **Provider APIs**: Implement proper authentication and rate limiting