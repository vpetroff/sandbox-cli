# Implementation Plan

- [x] 1. Extend core interfaces and types
  - Create new TypeScript interfaces for CreateSandboxOptions, DeployOptions, and SandboxMetadata
  - Extend the Config interface to include currentSandbox and sandboxes cache
  - Update BaseSandboxProvider abstract class with new createSandbox and deployToSandbox methods
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.1_

- [x] 2. Enhance ConfigManager for sandbox state management
  - Add methods to ConfigManager for getting/setting current sandbox selection
  - Implement sandbox metadata cache management (add, update, remove, list)
  - Add methods to store and retrieve sandbox deployment history
  - Write unit tests for new ConfigManager functionality
  - _Requirements: 1.3, 4.3, 5.5_

- [x] 3. Implement create command
  - Create src/cli/commands/create.ts with folder validation and Dockerfile checking
  - Implement provider selection logic (specified or default)
  - Add sandbox creation workflow with progress indicators
  - Implement automatic current sandbox selection after creation
  - Add comprehensive error handling with actionable messages
  - Write unit tests for create command logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 6.1, 6.3_

- [x] 4. Implement select command
  - Create src/cli/commands/select.ts with interactive sandbox selection
  - Implement multi-provider sandbox discovery and listing
  - Add numbered selection interface using inquirer
  - Implement current sandbox state persistence
  - Add error handling for no sandboxes available scenario
  - Write unit tests for select command functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Implement new deploy command
  - Create new src/cli/commands/deploy.ts replacing the existing implementation
  - Add current sandbox validation and existence checking
  - Implement code deployment to existing sandbox workflow
  - Add deployment progress indicators and status feedback
  - Implement deployment metadata updates (timestamp, count)
  - Add comprehensive error handling for deployment scenarios
  - Write unit tests for deploy command logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.2, 6.3, 7.1, 7.2, 7.3_

- [x] 6. Enhance list command with current sandbox highlighting
  - Modify src/cli/commands/list.ts to show current sandbox selection
  - Implement visual highlighting using chalk colors for current sandbox
  - Add deployment count and last deployed information to sandbox display
  - Enhance sandbox status display with more detailed information
  - Update error handling to work with new sandbox metadata
  - Write unit tests for enhanced list command
  - _Requirements: 5.1, 5.2_

- [x] 7. Extend provider base class and interfaces
  - Update src/providers/base.ts with new abstract methods
  - Implement createSandbox and deployToSandbox method signatures
  - Add getSandbox method for retrieving sandbox details
  - Update existing provider interface to maintain backward compatibility
  - Add sandbox lifecycle state constants and validation
  - Write unit tests for base provider interface changes
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 8. Update Daytona provider implementation
  - Modify src/providers/daytona.ts to implement createSandbox method
  - Implement deployToSandbox method for file synchronization to existing workspace
  - Add getSandbox method to retrieve workspace details
  - Update existing deploy method to use new split workflow internally
  - Implement efficient file sync mechanisms for iterative deployments
  - Add error handling specific to Daytona API limitations
  - Write integration tests for Daytona provider split workflow
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 7.1, 7.2_

- [x] 9. Update Azure Container Instances provider implementation
  - Modify src/providers/azure-aci.ts to implement createSandbox method
  - Implement deployToSandbox method for container image updates
  - Add getSandbox method to retrieve container instance details
  - Update existing deploy method to use new split workflow internally
  - Implement container image versioning for iterative deployments
  - Add Azure-specific error handling and retry logic
  - Write integration tests for Azure provider split workflow
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 7.1, 7.2_

- [x] 10. Update CLI command registration and routing
  - Modify src/cli/index.ts to register new create and select commands (without "sandbox" prefix)
  - Update deploy command registration to use new implementation
  - Remove old deploy command options that are no longer needed
  - Add proper command descriptions and help text
  - Ensure command aliases and shortcuts work correctly
  - Write integration tests for CLI command routing
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 11. Update destroy command to handle current sandbox cleanup
  - Modify src/cli/commands/destroy.ts to clear current selection when destroying current sandbox
  - Add confirmation prompts when destroying the currently selected sandbox
  - Update sandbox metadata cache cleanup
  - Implement proper error handling for destroy operations
  - Add tests for destroy command with current sandbox scenarios
  - _Requirements: 5.5_

- [x] 12. Add comprehensive error handling and user feedback
  - Implement consistent error message formatting across all commands
  - Add progress indicators using ora for long-running operations
  - Implement proper exit codes for different error scenarios
  - Add helpful suggestions in error messages (next steps, commands to run)
  - Create utility functions for common error handling patterns
  - Write tests for error handling scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 13. Write end-to-end integration tests
  - Create test suite for complete create → select → deploy → list workflow
  - Test multi-sandbox scenarios with switching between sandboxes
  - Add tests for error recovery and edge cases
  - Test provider-specific workflows with mock implementations
  - Add performance tests for large application deployments
  - Create tests for concurrent CLI usage scenarios
  - _Requirements: 1.5, 2.5, 4.5, 5.1, 7.4, 7.5_

- [x] 14. Update documentation and help text
  - Update command help text and descriptions for all modified commands
  - Add examples for new workflow in command help
  - Update README.md with new command structure and workflows
  - Add troubleshooting section for new command scenarios
  - Create migration guide for users of the old deploy command
  - _Requirements: 6.3, 6.4_