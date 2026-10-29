const puppeteer = require('puppeteer');
const { customLog } = require('./loggerHelper');

const RENDER_CONCURRENCY = Number(process.env.PEKO_PDF_CONCURRENCY) || 2;
const PAGE_TIMEOUT_MS = Number(process.env.PEKO_PDF_TIMEOUT_MS) || 15000;
const MAX_RENDERS_PER_BROWSER =
    Number(process.env.PEKO_PDF_BROWSER_MAX_RENDERS) || 500;
const QUEUE_LIMIT = Number(process.env.PEKO_PDF_QUEUE_LIMIT) || 100;
const MAX_RETRIES = Number(process.env.PEKO_PDF_MAX_RETRIES) || 1;
// Max time to wait for in-page images to finish loading before printing. Instant for inline/data-URI
// images; bounds external images (e.g. partner logos) so a slow image can't stall the render.
const IMAGE_WAIT_MS = Number(process.env.PEKO_PDF_IMAGE_WAIT_MS) || 8000;

// Crash-class errors thrown by puppeteer when the browser/page connection dies
// mid-render. Distinct from template/content errors — only these should retry.
const CRASH_PATTERNS = /target closed|session closed|protocol error|connection closed|browser has disconnected|browser is closed|page crashed|websocket is not open/i;
const isTransientCrash = (err) =>
    Boolean(err) && CRASH_PATTERNS.test(err?.message || '');

// Web-font hosts. On production these are frequently slow/unreachable (no egress / firewall), and a
// PENDING font request makes page.pdf() hang until the page timeout — the root cause of the airline
// ticket "PDF generation timed out" failures. Abort web fonts so Chromium falls back to system fonts
// immediately; a PDF must never BLOCK on a remote font.
const FONT_HOST_DENYLIST = ['fonts.googleapis.com', 'fonts.gstatic.com', 'use.typekit.net'];

// Guard a page against hanging on slow/unreachable external resources. Aborts web-font requests so
// Chromium uses system fonts instantly; data: URIs and everything else (document, images, layout CSS)
// pass through. Best-effort, never throws.
const applyPdfResourceGuards = async (page) => {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        try {
            const url = request.url();
            const type = request.resourceType();
            if (url.startsWith('data:')) {
                request.continue();
                return;
            }
            if (type === 'font' || FONT_HOST_DENYLIST.some((host) => url.includes(host))) {
                request.abort();
                return;
            }
            request.continue();
        } catch (err) {
            try { request.continue(); } catch (_) { /* request already handled */ }
        }
    });
};

// Wait for in-page images to finish (bounded). Inline/data-URI images are already complete so this
// resolves instantly; external images (logos) are capped at IMAGE_WAIT_MS so one slow image can't stall.
const waitForImages = async (page) => {
    await Promise.race([
        page.evaluate(async () => {
            const images = Array.from(document.images || []);
            await Promise.all(
                images.map((img) => (img.complete
                    ? Promise.resolve()
                    : new Promise((resolve) => {
                        const t = setTimeout(resolve, 5000);
                        img.addEventListener('load', () => { clearTimeout(t); resolve(); }, { once: true });
                        img.addEventListener('error', () => { clearTimeout(t); resolve(); }, { once: true });
                    })))
            );
        }),
        new Promise((resolve) => { setTimeout(resolve, IMAGE_WAIT_MS); }),
    ]);
};

let browserPromise = null;
let renderCount = 0;
let activeRenders = 0;

const launchBrowser = () =>
    puppeteer.launch({
        headless: 'shell',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

const isAlive = (b) => Boolean(b) && b.connected !== false;

const getBrowser = async () => {
    if (browserPromise) {
        try {
            const existing = await browserPromise;
            if (isAlive(existing)) return existing;
        } catch (err) {
            customLog(null, 'error', {
                message: 'puppeteerPool: existing browser unusable — relaunching',
                scope: 'pdf-pool',
                error: err?.message,
                stats: stats(),
            });
        }
        browserPromise = null;
    }

    customLog(null, 'info', { message: 'puppeteerPool: launching browser', scope: 'pdf-pool' });
    browserPromise = launchBrowser()
        .then((b) => {
            renderCount = 0;
            b.on('disconnected', () => {
                customLog(null, 'info', { message: 'puppeteerPool: browser disconnected', scope: 'pdf-pool' });
                browserPromise = null;
            });
            return b;
        })
        .catch((err) => {
            browserPromise = null;
            customLog(null, 'error', {
                message: 'puppeteerPool: browser launch failed',
                stats: stats(),
                scope: 'pdf-pool',
                error: err?.message,
                stack: err?.stack,
            });
            throw err;
        });

    return browserPromise;
};

const recycleIfNeeded = async () => {
    if (!browserPromise) return;
    if (renderCount < MAX_RENDERS_PER_BROWSER) return;
    if (activeRenders > 0) return;

    customLog(null, 'info', {
        message: 'puppeteerPool: recycling browser to release memory',
        scope: 'pdf-pool',
        rendersServed: renderCount,
        threshold: MAX_RENDERS_PER_BROWSER,
    });
    const stale = browserPromise;
    browserPromise = null;
    renderCount = 0;
    try {
        const b = await stale;
        await b.close();
    } catch (err) {
        customLog(null, 'error', {
            message: 'puppeteerPool: browser close during recycle failed',
            scope: 'pdf-pool',
            error: err?.message,
            stats: stats(),
        });
    }
};

let active = 0;
const waiters = [];
const acquire = () =>
    new Promise((resolve, reject) => {
        if (active < RENDER_CONCURRENCY) {
            active += 1;
            resolve();
            return;
        }
        if (waiters.length >= QUEUE_LIMIT) {
            const err = new Error('PDF render queue full');
            err.code = 'PDF_QUEUE_FULL';
            err.status = 503;
            customLog(null, 'error', {
                message: 'puppeteerPool: queue full — rejecting render',
                scope: 'pdf-pool',
                active,
                queued: waiters.length,
                queueLimit: QUEUE_LIMIT,
                stats: stats(),
            });
            reject(err);
            return;
        }
        waiters.push(resolve);
    });
const release = () => {
    const next = waiters.shift();
    if (next) {
        next();
    } else {
        active -= 1;
    }
};

const renderPdf = async (html, pdfOptions = {}, contentOptions = {}) => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        await acquire();
        activeRenders += 1;
        let page;
        try {
            const browser = await getBrowser();
            page = await browser.newPage();

            // Never let a slow/unreachable external web font hang the render (prod root cause).
            await applyPdfResourceGuards(page);

            await page.setContent(html, {
                waitUntil: 'domcontentloaded',
                timeout: PAGE_TIMEOUT_MS,
                ...contentOptions,
            });

            // Ensure logos/images are painted before printing (bounded; instant for inline images).
            await waitForImages(page);

            const safePdfOptions = { ...pdfOptions };
            delete safePdfOptions.path;
            const pdfBytes = await page.pdf({
                format: 'A4',
                preferCSSPageSize: true,
                timeout: PAGE_TIMEOUT_MS,
                ...safePdfOptions,
            });

            return Buffer.from(pdfBytes);
        } catch (err) {
            const willRetry = attempt < MAX_RETRIES && isTransientCrash(err);
            if (!willRetry) throw err;
            customLog(null, 'error', {
                message: 'puppeteerPool: chromium crash detected — retrying',
                scope: 'pdf-pool',
                attempt: attempt + 1,
                maxAttempts: MAX_RETRIES + 1,
                error: err?.message,
            });
            // Defensive: force the next acquire to relaunch chromium in case
            // the disconnect handler hasn't fired yet. Worst case: an extra
            // ~1.5 s launch on retry; best case: avoids cascading failure.
            browserPromise = null;
        } finally {
            if (page) {
                try {
                    await page.close();
                } catch (_) {
                    // page already closed / browser gone
                }
            }
            renderCount += 1;
            activeRenders -= 1;
            release();
            recycleIfNeeded().catch(() => {});
        }
    }
    // Unreachable: the final iteration throws via the !willRetry branch.
    throw new Error('puppeteerPool: render loop exited without result');
};

const stats = () => ({
    active,
    queued: waiters.length,
    activeRenders,
    renderCount,
    hasBrowser: Boolean(browserPromise),
});

module.exports = { renderPdf, stats };
