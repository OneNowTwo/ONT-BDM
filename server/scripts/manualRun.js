require('dotenv').config();
const { runNightlyPipeline } = require('../cron');

console.log('[Manual Run] Starting pipeline...');
runNightlyPipeline()
  .then(() => {
    console.log('[Manual Run] Pipeline complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('[Manual Run] Pipeline failed:', err);
    process.exit(1);
  });
