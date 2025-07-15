#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { configureCommand } from './commands/configure';
import { createCommand } from './commands/create';
import { deployCommand } from './commands/deploy';
import { selectCommand } from './commands/select';
import { listCommand } from './commands/list';
import { browseCommand } from './commands/browse';
import { destroyCommand } from './commands/destroy';
import { executeCommand } from './commands/execute';

const program = new Command();

program
  .name('sandbox-cli')
  .description('CLI tool for deploying folders to sandbox environments')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize CLI configuration')
  .action(initCommand);

program
  .command('configure <provider>')
  .description('Configure a sandbox provider')
  .action(configureCommand);

program
  .command('create <folder>')
  .description('Create a new sandbox environment')
  .option('-p, --provider <provider>', 'Sandbox provider to use')
  .option('-d, --dockerfile <path>', 'Path to Dockerfile', './Dockerfile')
  .action(createCommand);

program
  .command('deploy <folder>')
  .description('Deploy code to the current sandbox')
  .option('-d, --dockerfile <path>', 'Path to Dockerfile (optional for incremental updates)')
  .action(deployCommand);

program
  .command('select')
  .description('Select the current active sandbox')
  .action(selectCommand);

program
  .command('list')
  .description('List all sandboxes (highlighting current)')
  .action(listCommand);

program
  .command('browse <sandbox-id>')
  .description('Open deployed app in browser')
  .action(browseCommand);

program
  .command('destroy <sandbox-id>')
  .description('Cleanup sandbox')
  .action(destroyCommand);

program
  .command('execute <command>')
  .description('Execute a command in the current sandbox')
  .option('--cwd <directory>', 'Working directory for command execution', '/workspaces/project')
  .option('--timeout <seconds>', 'Command timeout in seconds', '300')
  .option('--no-stream', 'Don\'t stream output, return all at once')
  .addHelpText('after', `
Examples:
  $ sandbox-cli execute "ls -la"                    # List files in default directory
  $ sandbox-cli execute "npm install"               # Install dependencies
  $ sandbox-cli execute "ls" --cwd /tmp             # List files in specific directory
  $ sandbox-cli execute "npm run build" --timeout 600  # Build with extended timeout
  $ sandbox-cli execute "cat package.json" --no-stream  # Get output all at once

Common Commands:
  Development:     npm install, npm run build, npm test
  File Operations: ls -la, cat file.txt, find . -name "*.js"
  Git Operations:  git status, git log --oneline
  System Info:     ps aux, df -h, free -m

Provider Support:
  ✅ Daytona - Full support with real-time streaming
  ✅ Azure Container Instances - Full support with real-time streaming
  ❌ E2B - Coming soon

Note: Requires an active sandbox. Use 'select' to choose one or 'create' to make a new sandbox.`)
  .action(executeCommand);

program.parse();