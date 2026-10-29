/**
 * eSIM Payment Worker
 * Processes jobs from Bull Queue for Bondio and Tunz eSIM vendors
 * Maintains sequential processing (concurrency: 1 per vendor queue)
 */

const { bondioQueue, tunzQueue } = require('../utils/bullQueue');
const { processEsimPayment } = require('./esimPaymentWorkerService');
const { customLog } = require('../utils/loggerHelper');

// Process Bondio queue jobs sequentially (concurrency: 1)
bondioQueue.process(1, async job => {
  customLog(job.data?.LogTraceId, 'info', {
    message: '[BULL WORKER] Processing Bondio payment job',
    jobId: job.id,
    jobAttempt: job.attemptsMade + 1,
    corporateTxnId: job.data.corporateTxnId,
  });

  try {
    const result = await processEsimPayment(job.data, job);
    customLog(job.data?.LogTraceId, 'info', {
      message: '[BULL WORKER] Bondio job completed',
      jobId: job.id,
      corporateTxnId: job.data.corporateTxnId,
    });
    return result;
  } catch (error) {
    customLog(job.data?.LogTraceId, 'error', {
      message: '[BULL WORKER] Bondio payment failed',
      jobId: job.id,
      corporateTxnId: job.data.corporateTxnId,
      attemptNumber: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
      willRetry: job.attemptsMade + 1 < job.opts.attempts,
      error: error.message,
    });
    throw error; // Bull will retry automatically until attempts are exhausted
  }
});

// Process Tunz queue jobs sequentially (concurrency: 1)
tunzQueue.process(1, async job => {
  customLog(job.data?.LogTraceId, 'info', {
    message: '[BULL WORKER] Processing Tunz payment job',
    jobId: job.id,
    jobAttempt: job.attemptsMade + 1,
    corporateTxnId: job.data.corporateTxnId,
  });

  try {
    const result = await processEsimPayment(job.data, job);
    customLog(job.data?.LogTraceId, 'info', {
      message: '[BULL WORKER] Tunz job completed',
      jobId: job.id,
      corporateTxnId: job.data.corporateTxnId,
    });
    return result;
  } catch (error) {
    customLog(job.data?.LogTraceId, 'error', {
      message: '[BULL WORKER] Tunz payment failed',
      jobId: job.id,
      corporateTxnId: job.data.corporateTxnId,
      attemptNumber: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
      willRetry: job.attemptsMade + 1 < job.opts.attempts,
      error: error.message,
    });
    throw error; // Bull will retry automatically until attempts are exhausted
  }
});

// Event handlers for job completion
bondioQueue.on('completed', job => {
  customLog(job.data?.LogTraceId, 'info', {
    message: '[BULL] Bondio job completed successfully',
    jobId: job.id,
    corporateTxnId: job.data.corporateTxnId,
  });
});

tunzQueue.on('completed', job => {
  customLog(job.data?.LogTraceId, 'info', {
    message: '[BULL] Tunz job completed successfully',
    jobId: job.id,
    corporateTxnId: job.data.corporateTxnId,
  });
});

// Event handlers for job failure. Bull emits 'failed' on EVERY failed attempt,
// not only the final one - only report DLQ when retries are actually exhausted.
bondioQueue.on('failed', (job, err) => {
  const exhausted = (job?.attemptsMade ?? 0) >= (job?.opts?.attempts ?? 1);
  customLog(job?.data?.LogTraceId, exhausted ? 'error' : 'info', {
    message: exhausted
      ? '❌ [BULL] Bondio job failed permanently - moved to DLQ'
      : '[BULL] Bondio job attempt failed - will retry',
    jobId: job?.id,
    corporateTxnId: job?.data?.corporateTxnId,
    attemptsMade: job?.attemptsMade,
    maxAttempts: job?.opts?.attempts,
    error: err?.message,
  });
});

tunzQueue.on('failed', (job, err) => {
  const exhausted = (job?.attemptsMade ?? 0) >= (job?.opts?.attempts ?? 1);
  customLog(job?.data?.LogTraceId, exhausted ? 'error' : 'info', {
    message: exhausted
      ? '❌ [BULL] Tunz job failed permanently - moved to DLQ'
      : '[BULL] Tunz job attempt failed - will retry',
    jobId: job?.id,
    corporateTxnId: job?.data?.corporateTxnId,
    attemptsMade: job?.attemptsMade,
    maxAttempts: job?.opts?.attempts,
    error: err?.message,
  });
});

// Event handlers for stalled jobs
bondioQueue.on('stalled', job => {
  customLog(job?.data?.LogTraceId, 'info', {
    message: '[BULL] Bondio job stalled (potential hang)',
    jobId: job?.id,
    corporateTxnId: job?.data?.corporateTxnId,
  });
});

tunzQueue.on('stalled', job => {
  customLog(job?.data?.LogTraceId, 'info', {
    message: '[BULL] Tunz job stalled (potential hang)',
    jobId: job?.id,
    corporateTxnId: job?.data?.corporateTxnId,
  });
});

console.log('[BULL WORKER] eSIM payment worker initialized - ready to process jobs');

module.exports = { bondioQueue, tunzQueue };
