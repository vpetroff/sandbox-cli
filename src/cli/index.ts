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

program.parse();