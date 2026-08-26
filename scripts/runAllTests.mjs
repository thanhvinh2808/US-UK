import { execSync } from 'child_process';

const testFiles = [
  'tests/accountManagement.test.mjs',
  'tests/authService.test.mjs',
  'tests/conjugationEngine.test.mjs',
  'tests/dataIntegrity.test.mjs',
  'tests/dataRecovery.test.mjs',
  'tests/dataSync.test.mjs',
  'tests/deploymentConfig.test.mjs',
  'tests/frontendAuth.test.mjs',
  'tests/healthCheck.test.mjs',
  'tests/launchSmoke.test.mjs',
  'tests/learningIntelligence.test.mjs',
  'tests/middleware.test.mjs',
  'tests/productionEnvironment.test.mjs',
  'tests/productionHardening.test.mjs',
  'tests/productionReadiness.test.mjs',
  'tests/productionUx.test.mjs',
  'tests/publicExperience.test.mjs',
  'tests/publicMarketing.test.mjs',
  'tests/realWorldUx.test.mjs',
  'tests/securitySuite.test.mjs',
  'tests/storage.test.mjs',
  'tests/translatorFeatures.test.mjs',
  'tests/visualExcellence.test.mjs',
  'tests/realWorldQaPhase15.test.mjs',
  'tests/authModalErrorHandling.test.mjs',
  'tests/unifiedNavigation.test.mjs',
  'tests/guestLearningMerge.test.mjs',
  'tests/cefrLearningEngine.test.mjs',
  'tests/visualLearningContent.test.mjs'
];

console.log('================ STARTING COMPLETE TEST SUITE (29 FILES) ================\n');

let allPassed = true;

for (const file of testFiles) {
  process.stdout.write(`Running ${file}... `);
  const start = Date.now();
  try {
    execSync(`node ${file}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const elapsed = Date.now() - start;
    console.log(`✅ PASS (${elapsed}ms)`);
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`❌ FAIL (${elapsed}ms)`);
    console.error(err.stdout || err.message);
    allPassed = false;
  }
}

console.log('\n================ TEST EXECUTION FINISHED ================');
if (!allPassed) {
  process.exit(1);
} else {
  console.log(`ALL ${testFiles.length} TEST SUITES PASSED (100% SUCCESS, 0 FAILED)\n`);
  process.exit(0);
}
