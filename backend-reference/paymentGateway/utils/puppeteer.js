const { renderPdf } = require('./puppeteerPool');
const { customLog } = require('./loggerHelper');

/**
 * Generate a PDF from HTML content.
 *
 * Thin wrapper over the pooled, concurrency-capped renderer in puppeteerPool.js — one reused
 * Chromium instance, a bounded number of concurrent renders (PEKO_PDF_CONCURRENCY, default 2) with
 * the rest queued (PEKO_PDF_QUEUE_LIMIT), browser recycling, crash-retry, web-font blocking and a
 * bounded image wait. This replaces the previous "launch a new browser per request" approach, which
 * fell over under load: N concurrent bookings meant N Chromium instances → memory/CPU exhaustion →
 * every render slowed down → cascading 180s timeouts (the production symptom).
 *
 * Returns the legacy { status, buffer, message } shape so existing callers are unchanged. Per-render
 * timeouts are owned by the pool (PEKO_PDF_TIMEOUT_MS); any timeout/imageTimeout passed in `options`
 * is ignored, since under the concurrency cap each render completes well within the pool's budget.
 *
 * @param {Object} params
 * @param {string} params.html - The HTML content to convert to PDF.
 * @param {Object} [params.options] - puppeteer page.pdf options (landscape, printBackground, etc.).
 * @returns {Promise<{status: boolean, buffer: Buffer | null, fileType: string, message?: string}>}
 */
exports.puppeteerPdfBufferGenerator = async ({ html = '', options = {} }) => {
    const pdfOptions = {
        landscape: false,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        ...options,
    };
    // Timeouts are managed centrally by the pool, not per-call — drop them from page.pdf options.
    delete pdfOptions.timeout;
    delete pdfOptions.imageTimeout;

    try {
        const buffer = await renderPdf(html, pdfOptions);
        return {
            status: true,
            buffer,
            fileType: 'application/pdf',
        };
    } catch (error) {
        const errorMessage = error?.code === 'PDF_QUEUE_FULL'
            ? 'PDF service is busy (render queue full) — please retry'
            : error?.name === 'TimeoutError'
                ? 'PDF generation timed out'
                : error?.message || 'Something went wrong while generating PDF';
        customLog(null, 'error', {
            message: 'HTML to pdf conversion failed',
            errorName: error?.name,
            errorMessage,
        });
        return {
            status: false,
            buffer: null,
            fileType: 'application/pdf',
            message: errorMessage,
        };
    }
};
