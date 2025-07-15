# Design Document

## Overview

This design adds a new `execute` command that allows users to run shell commands directly in their deployed sandbox environments. The command will integrate with the existing sandbox management system and work across different providers (Daytona, Azure ACI).

## Architecture

### Command Structure

The new command will be:
- `execute <command>` - Execute a command in the current sandbox
- `execute [options] <command>` - Execute with additional options

### Command Options

- `--cwd <directory>` - Working directory for command execution (default: /workspaces/project)
- `--timeout <seconds>` - Command timeout in seconds (default: 300)
- `--no-stream` - Don't stream output, return all at once

## Components and Interfaces

### New Interfaces

```typescript
interface ExecuteOptions {
  command: string;
  cwd?: string;
  timeout?: number;
  stream?: boolean;
}

interface ExecuteResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}
```

### Provider Interface Extensions

The `BaseSandboxProvider` interface will be extended with:

```typescript
abstract class BaseSandboxProvider {
  // Existing methods...
  
  // New method for command execution
  abstract executeCommand(sandboxId: string, options: ExecuteOptions): Promise<ExecuteResult>;
  abstract supportsExecution(): boolean;
}
```

### Command Implementation

#### Execute Command (`src/cli/commands/execute.ts`)

1. **Current Sandbox Check**: Verify a sandbox is selected
2. **Command Validation**: Ensure command is provided and valid
3. **Provider Check**: Verify provider supports command execution
4. **Execution**: Stream command output in real-time
5. **Result Display**: Show exit code and execution summary

## Data Models

### Command Execution Flow

1. **Validation Phase**:
   - Check current sandbox selection
   - Validate command syntax
   - Verify provider capabilities

2. **Execution Phase**:
   - Get sandbox instance from provider
   - Execute command with streaming output
   - Handle interruption signals (Ctrl+C)

3. **Result Phase**:
   - Display final exit code
   - Show execution duration
   - Update command history (optional)

### Provider-Specific Implementations

**Daytona Provider**:
- Use Daytona SDK's command execution API
- Stream output using SDK's streaming capabilities
- Handle working directory changes

**Azure Container Instances Provider**:
- Use Azure Container Instance exec API
- Stream output through Azure's exec session
- Handle container state validation

## Error Handling

### Execute Command Errors

- **No current sandbox**: Prompt to run `select` command
- **Sandbox not found**: Suggest running `list` to verify
- **Sandbox not running**: Display current status and suggest restart
- **Command timeout**: Allow user to extend timeout or cancel
- **Provider not supported**: Clear message about provider limitations
- **Permission denied**: Guidance on sandbox permissions

### Provider-Specific Errors

- **Daytona**: Handle SDK connection issues and workspace state
- **Azure**: Handle container exec session failures and authentication
- **Network issues**: Retry mechanisms and connection troubleshooting

## Security Considerations

### Command Validation

- **Input sanitization**: Prevent command injection attacks
- **Command restrictions**: Optional whitelist/blacklist of allowed commands
- **Working directory validation**: Ensure cwd paths are safe
- **Timeout enforcement**: Prevent runaway processes

### Provider Security

- **Authentication**: Use existing provider credentials
- **Sandbox isolation**: Commands run within sandbox boundaries
- **Output filtering**: Optional filtering of sensitive information
- **Audit logging**: Track command execution for security purposes

## Implementation Details

### Real-time Output Streaming

```typescript
// Pseudo-code for streaming implementation
async function executeWithStreaming(provider, sandboxId, command) {
  const stream = await provider.executeCommand(sandboxId, {
    command,
    stream: true
  });
  
  stream.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });
  
  stream.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });
  
  return new Promise((resolve) => {
    stream.on('close', (exitCode) => {
      resolve({ exitCode });
    });
  });
}
```

### Signal Handling

```typescript
// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\nInterrupting command...');
  await provider.cancelExecution(sandboxId);
  process.exit(130);
});
```

## Testing Strategy

### Unit Tests

- **Command parsing**: Test argument and option parsing
- **Provider interface**: Mock provider implementations
- **Error scenarios**: Comprehensive error condition coverage
- **Signal handling**: Test interruption scenarios

### Integration Tests

- **End-to-end execution**: Test complete command execution flow
- **Provider compatibility**: Test with each supported provider
- **Streaming output**: Verify real-time output streaming
- **Error recovery**: Test error handling and recovery

### Manual Testing Scenarios

1. **Basic commands**: `ls`, `pwd`, `echo`
2. **Long-running commands**: Build processes, installations
3. **Interactive commands**: Commands requiring input
4. **Error commands**: Commands that fail or timeout
5. **Complex commands**: Multi-part commands with pipes and redirects

## Performance Considerations

- **Output buffering**: Efficient streaming without overwhelming the terminal
- **Memory usage**: Handle large command outputs gracefully
- **Network efficiency**: Minimize bandwidth usage for command execution
- **Timeout handling**: Reasonable defaults with user override options