#!/usr/bin/env node

import { Command } from "commander";
import { createCommand } from './presentation/cli/commands/create.command.js';

const program = new Command();

program
  .name("ccpf")
  .description("CCPF Project Automation CLI")
  .version("0.1.0");
  
program.addCommand(createCommand());

program.parse();
