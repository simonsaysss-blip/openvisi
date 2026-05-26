#!/usr/bin/env node
import { Command } from "commander";
import { registerCommands } from "./commands/index.js";

const program = new Command();

program
  .name("openvisi")
  .description("Open-source AI Visibility diagnostics for the LLM search era.")
  .version("0.1.0");

registerCommands(program);

program.parseAsync(process.argv);
