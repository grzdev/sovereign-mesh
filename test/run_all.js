/**
 * SovereignMesh - Automated Test Runner
 */
import { SecretVault } from '../src/core/vault.js';
import { CodeSanitizer } from '../src/core/sanitizer.js';
import { CodeRehydrator } from '../src/core/rehydrator.js';
import { TriageRouter } from '../src/core/triage.js';
import { BudgetGovernor } from '../src/core/governor.js';
import chalk from 'chalk';
let passed = 0;
let failed = 0;
function assert(condition, testName) {
    if (condition) {
        console.log(chalk.green(`  ✔ PASS: ${testName}`));
        passed++;
    }
    else {
        console.error(chalk.red(`  ✖ FAIL: ${testName}`));
        failed++;
    }
}
async function runTests() {
    console.log(chalk.bold.cyan('\n=== SovereignMesh Test Suite ===\n'));
    // 1. Vault & Sanitizer Tests
    console.log(chalk.bold('1. Testing Vault & Air-Gap Sanitizer:'));
    const vault = new SecretVault();
    const rawCode = `
    const AWS = "AKIAIOSFODNN7EXAMPLE";
    const DB = "mongodb://user:pass@10.0.1.5:27017/prod";
    const KEY = "sk-live-1234567890abcdefghijklmn";
    const IP = "192.168.1.50";
    const EMAIL = "admin@corp.internal";
  `;
    const sanitizeResult = CodeSanitizer.sanitize(rawCode, vault);
    assert(sanitizeResult.scrubbedCount >= 5, `Detected and scrubbed all ${sanitizeResult.scrubbedCount} sensitive secrets`);
    assert(!sanitizeResult.sanitizedContent.includes('AKIAIOSFODNN7EXAMPLE'), 'Raw AWS key stripped from sanitized content');
    assert(!sanitizeResult.sanitizedContent.includes('mongodb://user:pass'), 'Database credentials stripped');
    assert(!sanitizeResult.sanitizedContent.includes('sk-live-12345'), 'Raw secret token stripped');
    assert(sanitizeResult.sanitizedContent.includes('[VAULT_'), 'Inserted [VAULT_...] tokens');
    // 2. Rehydration Tests
    console.log(chalk.bold('\n2. Testing In-Memory Rehydration:'));
    const simulatedModelOutput = `
    // Refactored patch from Otari:
    const client = connect({
      auth: "[VAULT_API_KEY_1]",
      uri: "[VAULT_DB_URL_1]"
    });
  `;
    const rehydrateResult = CodeRehydrator.rehydrate(simulatedModelOutput, vault);
    assert(rehydrateResult.restoredCount === 2, `Restored ${rehydrateResult.restoredCount} secrets in local RAM`);
    assert(rehydrateResult.rehydratedContent.includes('AKIAIOSFODNN7EXAMPLE'), 'AWS Key restored accurately');
    assert(rehydrateResult.rehydratedContent.includes('mongodb://user:pass@10.0.1.5:27017/prod'), 'DB URI restored accurately');
    assert(!rehydrateResult.rehydratedContent.includes('[VAULT_API_KEY_1]'), 'Tokens cleanly replaced');
    // 3. Triage Router Tests
    console.log(chalk.bold('\n3. Testing Dual-Tier Triage Router:'));
    const simpleDecision = TriageRouter.evaluate('Add JSDoc comments to this function', 'function add(a, b) { return a + b; }');
    assert(simpleDecision.tier === 'LOCAL_ONLY', 'Simple docstring task triaged to LOCAL_ONLY ($0)');
    const complexDecision = TriageRouter.evaluate('Architect a high-performance distributed microservice with thread-safe async queue and database connection pooling', rawCode);
    assert(complexDecision.tier === 'OTARI_HYBRID', 'Complex architectural refactor triaged to OTARI_HYBRID');
    // 4. Governor & Budget Tests
    console.log(chalk.bold('\n4. Testing Token & Budget Governor:'));
    const governor = new BudgetGovernor({ sessionBudgetUSD: 1.00 });
    governor.recordLocal(500);
    governor.recordCloud(1200, 3);
    const stats = governor.getStats();
    assert(stats.totalRequests === 2, 'Total requests tracked correctly');
    assert(stats.localRequests === 1, 'Local request recorded');
    assert(stats.cloudRequests === 1, 'Cloud request recorded');
    assert(stats.dollarsSaved > 0, 'Local cost savings calculated ($' + stats.dollarsSaved + ')');
    assert(stats.zeroLeakRedactionsCount === 3, 'Zero-leak redaction count tracked');
    // Summary
    console.log(chalk.bold.cyan('\n=== Test Summary ==='));
    console.log(`Passed: ${chalk.green(passed)}`);
    console.log(`Failed: ${failed > 0 ? chalk.red(failed) : chalk.gray(0)}\n`);
    if (failed > 0)
        process.exit(1);
}
runTests();
