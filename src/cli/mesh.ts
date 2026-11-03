#!/usr/bin/env node
/**
 * SovereignMesh - Terminal Developer CLI
 * Run air-gapped tasks and audit codebases right from your shell.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { MeshOrchestrator } from '../core/orchestrator.js';
import { CodeSanitizer } from '../core/sanitizer.js';
import { SecretVault } from '../core/vault.js';

const program = new Command();
const orchestrator = new MeshOrchestrator();

program
  .name('mesh')
  .description('SovereignMesh: Zero-Leak Hybrid Agent Gateway (Local PC + Mozilla Otari)')
  .version('1.0.0');

// Status Command
program
  .command('status')
  .description('Check connectivity to Local Ollama node and Otari cloud gateway')
  .action(async () => {
    console.log(chalk.bold.cyan('\n=== SovereignMesh Node Status ===\n'));

    // Check Ollama
    const ollamaOk = await orchestrator.getOllama().isAvailable();
    if (ollamaOk) {
      const models = await orchestrator.getOllama().listModels();
      console.log(chalk.green('✔ Local Edge Node (Ollama):') + ` Online (${models.join(', ') || 'ready'})`);
    } else {
      console.log(chalk.red('✖ Local Edge Node (Ollama):') + ' Offline (Run ollama serve or check port 11434)');
    }

    // Check Otari
    const otariConfigured = orchestrator.getOtari().isConfigured();
    if (otariConfigured) {
      console.log(chalk.green('✔ Cloud Gateway (Mozilla Otari):') + ' Authenticated & Ready (Default: alibaba/qwen-3.5-35b-a3b)');
    } else {
      console.log(chalk.yellow('⚠ Cloud Gateway (Mozilla Otari):') + ' OTARI_API_KEY not configured in .env.local');
    }

    // Governor
    const stats = orchestrator.getGovernor().getStats();
    console.log(chalk.bold.cyan('\n=== Governor Telemetry ==='));
    console.log(`Total Requests:         ${stats.totalRequests}`);
    console.log(`Local Requests ($0):    ${stats.localRequests}`);
    console.log(`Otari Cloud Requests:   ${stats.cloudRequests}`);
    console.log(`Zero-Leak Redactions:   ${chalk.green(stats.zeroLeakRedactionsCount)}`);
    console.log(`Dollars Saved Locally:  ${chalk.green('$' + stats.dollarsSaved.toFixed(4))}`);
    console.log(`Budget Remaining:       $${stats.budgetRemainingUSD.toFixed(4)}\n`);
  });

// Audit Command
program
  .command('audit <filePath>')
  .description('Scan a file for sensitive secrets, credentials, and private endpoints')
  .action(async (filePath: string) => {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(chalk.red(`File not found: ${filePath}`));
      process.exit(1);
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(chalk.bold.cyan(`\n🔍 Auditing file: ${filePath}`));

    const vault = new SecretVault();
    const result = CodeSanitizer.sanitize(content, vault);

    if (result.scrubbedCount === 0) {
      console.log(chalk.green('✔ Clean: No exposed credentials or secrets detected.'));
      return;
    }

    console.log(chalk.yellow(`\n⚠️  Found ${result.scrubbedCount} sensitive item(s):\n`));
    for (const item of result.report) {
      console.log(`  • [${chalk.magenta(item.type)}] Token: ${chalk.bold(item.token)} | Masked: ${item.maskedPreview}`);
    }

    console.log(chalk.bold.green('\nAir-gap scrubbed preview:'));
    console.log(chalk.gray('--------------------------------------------------'));
    console.log(result.sanitizedContent.slice(0, 500) + (result.sanitizedContent.length > 500 ? '\n...[truncated]' : ''));
    console.log(chalk.gray('--------------------------------------------------'));
    console.log(chalk.cyan(`\nRun: mesh run "Refactor this file" --file ${filePath} to solve via SovereignMesh.\n`));
  });

// Run Command
program
  .command('run <prompt>')
  .description('Execute an air-gapped agent task with intelligent dual-tier triage')
  .option('-f, --file <filePath>', 'Path to source code file to attach')
  .option('-p, --preference <mode>', 'Routing preference: auto, local, or cloud', 'auto')
  .action(async (prompt: string, options: any) => {
    let codePayload = '';
    if (options.file) {
      const fullPath = path.resolve(process.cwd(), options.file);
      if (fs.existsSync(fullPath)) {
        codePayload = fs.readFileSync(fullPath, 'utf8');
      } else {
        console.error(chalk.red(`File not found: ${options.file}`));
        process.exit(1);
      }
    }

    console.log(chalk.bold.cyan('\n⚡ SovereignMesh Execution Pipeline ⚡\n'));

    try {
      const result = await orchestrator.process(
        {
          prompt,
          codePayload,
          preference: options.preference as any
        },
        (evt) => {
          const stepColors: Record<string, any> = {
            TRIAGE: chalk.yellow,
            SANITIZATION: chalk.magenta,
            EXECUTION: chalk.cyan,
            REHYDRATION: chalk.blue,
            COMPLETE: chalk.green,
            ERROR: chalk.red
          };
          const colorFn = stepColors[evt.step] || chalk.white;
          console.log(`[${colorFn(evt.step)}] ${evt.message}`);
        }
      );

      console.log(chalk.bold.green('\n=== Generated Solution ===\n'));
      console.log(result.finalContent);
      console.log(chalk.bold.cyan('\n=== Execution Summary ==='));
      console.log(`Tier:             ${result.execution.tier}`);
      console.log(`Model:            ${result.execution.model}`);
      console.log(`Duration:         ${result.execution.durationMs}ms`);
      console.log(`Secrets Isolated: ${result.sanitization.scrubbedCount}`);
      console.log(`Secrets Restored: ${result.rehydration.restoredCount}`);
      console.log(`Cost:             ${result.execution.tier === 'LOCAL_ONLY' ? chalk.green('$0.00 (Local)') : '$' + ((result.execution.tokens / 1000) * 0.0004).toFixed(4)}\n`);
    } catch (err: any) {
      console.error(chalk.red(`Execution Failed: ${err.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
