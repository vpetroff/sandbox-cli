#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { configureCommand } from './commands/configure';
import { deployCommand } from './commands/deploy';
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
  .command('deploy <folder>')
  .description('Deploy a folder to a sandbox environment')
  .option('-p, --provider <provider>', 'Sandbox provider to use')
  .option('-d, --dockerfile <path>', 'Path to Dockerfile', './Dockerfile')
  .action(deployCommand);

program
  .command('list')
  .description('List active sandboxes')
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