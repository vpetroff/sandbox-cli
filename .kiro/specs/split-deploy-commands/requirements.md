# Requirements Document

## Introduction

This feature splits the current one-shot deployment process into two distinct stages: sandbox creation and code deployment. The current `deploy` command creates a container image, provisions a sandbox environment, and deploys the image in a single operation. The new approach separates these concerns to enable iterative development workflows where developers can create a sandbox once and then deploy code changes multiple times to the same environment.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to create a sandbox environment separately from deploying code, so that I can set up the infrastructure once and reuse it for multiple deployments.

#### Acceptance Criteria

1. WHEN I run `create <app-folder>` THEN the system SHALL create a new sandbox environment without deploying code
2. WHEN the sandbox is created THEN the system SHALL return a unique sandbox identifier
3. WHEN the sandbox is created THEN the system SHALL store sandbox metadata for future reference
4. IF the app folder contains a Dockerfile THEN the system SHALL build and store the base container image
5. WHEN the create command completes THEN the sandbox SHALL be ready to receive code deployments

### Requirement 2

**User Story:** As a developer, I want to deploy code to the current sandbox, so that I can iterate quickly on my application without specifying the target each time.

#### Acceptance Criteria

1. WHEN I run `deploy <app-folder>` THEN the system SHALL deploy the current code to the currently selected sandbox
2. WHEN deploying to the current sandbox THEN the system SHALL update the running application with the new code
3. WHEN the deployment completes THEN the system SHALL provide the URL to access the updated application
4. IF no current sandbox is selected THEN the system SHALL return an error message prompting to select one
5. WHEN deploying multiple times to the same sandbox THEN each deployment SHALL replace the previous version

### Requirement 3

**User Story:** As a developer, I want to specify provider-specific options during sandbox creation, so that I can configure the environment according to my needs.

#### Acceptance Criteria

1. WHEN creating a sandbox THEN the system SHALL accept provider selection via `--provider` flag
2. WHEN no provider is specified THEN the system SHALL use the configured default provider
3. WHEN creating a sandbox THEN the system SHALL accept provider-specific configuration options
4. WHEN provider options are invalid THEN the system SHALL return clear error messages
5. WHEN the sandbox is created THEN the system SHALL store the provider configuration for future deployments

### Requirement 4

**User Story:** As a developer, I want to select which sandbox is currently active, so that I can easily switch between different sandbox environments.

#### Acceptance Criteria

1. WHEN I run `select` THEN the system SHALL display a list of all existing sandboxes
2. WHEN selecting from the sandbox list THEN the system SHALL allow me to choose which sandbox becomes the current one
3. WHEN a sandbox is selected THEN the system SHALL store this selection for future deploy commands
4. WHEN no sandboxes exist THEN the system SHALL inform me that I need to create one first
5. WHEN a sandbox is selected THEN the system SHALL confirm which sandbox is now current

### Requirement 5

**User Story:** As a developer, I want to see all my sandboxes with clear indication of which one is currently active, so that I can easily understand my sandbox environment state.

#### Acceptance Criteria

1. WHEN I run `list` THEN the system SHALL show all existing sandboxes
2. WHEN listing sandboxes THEN the system SHALL visually highlight the currently selected sandbox using color or text styling
3. WHEN I run `browse <sandbox-id>` THEN the system SHALL open the specified sandbox in a browser
4. WHEN I run `destroy <sandbox-id>` THEN the system SHALL properly clean up the specified sandbox
5. WHEN the current sandbox is destroyed THEN the system SHALL clear the current selection

### Requirement 6

**User Story:** As a developer, I want clear feedback about sandbox state and deployment progress, so that I can understand what's happening during each operation.

#### Acceptance Criteria

1. WHEN creating a sandbox THEN the system SHALL show progress indicators for each step
2. WHEN deploying to a sandbox THEN the system SHALL show deployment progress and status
3. WHEN operations complete THEN the system SHALL provide clear success messages with next steps
4. WHEN operations fail THEN the system SHALL provide actionable error messages
5. WHEN checking sandbox status THEN the system SHALL indicate if the sandbox is ready for deployment

### Requirement 7

**User Story:** As a developer, I want the deploy command to handle file synchronization efficiently, so that deployments are fast even for large applications.

#### Acceptance Criteria

1. WHEN deploying code changes THEN the system SHALL only transfer modified files when possible
2. WHEN the provider supports incremental updates THEN the system SHALL use efficient sync mechanisms
3. WHEN deploying large applications THEN the system SHALL provide progress feedback
4. WHEN file transfer fails THEN the system SHALL retry with appropriate backoff
5. WHEN deployment completes THEN the system SHALL verify the application is running correctly