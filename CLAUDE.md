# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CLI application for deploying folders to sandbox environments (Daytona, E2B, Azure Container Instances).

**Technology Stack:**
- TypeScript/Node.js
- Commander.js for CLI parsing
- Inquirer.js for interactive prompts
- Axios for HTTP requests

## Common Commands

```bash
# Development
npm run dev          # Run in development mode
npm run build        # Build TypeScript to JavaScript
npm run test         # Run tests
npm run lint         # Run ESLint

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
├── cli/           # CLI command implementations and prompts
├── providers/     # Sandbox provider implementations (Daytona, E2B, Azure)
├── core/          # Configuration, deployment orchestration, file transfer
└── utils/         # Docker processing, browser utilities
```

## Configuration

CLI stores configuration in `~/.sandbox-cli/config.json` with provider credentials and settings.

## Provider Implementations

Each provider in `src/providers/` implements the base interface:
- Template/container creation
- Sandbox instance provisioning  
- File transfer
- URL access for deployed apps