const puppeteer = require('puppeteer');

const RENDER_CONCURRENCY = Number(process.env.PEKO_PDF_CONCURRENCY) || 2;
const PAGE_TIMEOUT_MS = Number(process.env.PEKO_PDF_TIMEOUT_MS) || 15000;
const MAX_RENDERS_PER_BROWSER =
    Number(process.env.PEKO_PDF_BROWSER_MAX_RENDERS) || 500;
const QUEUE_LIMIT = Number(process.env.PEKO_PDF_QUEUE_LIMIT) || 100;

let browserPromise = null;
let renderCount = 0;
let activeRenders = 0;

const launchBrowser = () =>
    puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

const isAlive = (b) => Boolean(b) && b.connected !== false;

const getBrowser = async () => {
    if (browserPromise) {
        try {
            const existing = await browserPromise;
            if (isAlive(existing)) return existing;
        } catch (_) {
            // fall through and relaunch
        }
        browserPromise = null;
    }

    browserPromise = launchBrowser()
        .then((b) => {
            renderCount = 0;
            b.on('disconnected', () => {
                browserPromise = null;
            });
            return b;
        })
        .catch((err) => {
            browserPromise = null;
            throw err;
        });

    return browserPromise;
};

const recycleIfNeeded = async () => {
    if (!browserPromise) return;
    if (renderCount < MAX_RENDERS_PER_BROWSER) return;
    if (activeRenders > 0) return;

    const stale = browserPromise;
    browserPromise = null;
    renderCount = 0;
    try {
        const b = await stale;
        await b.close();
    } catch (_) {
        // best-effort cleanup
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
    await acquire();
    activeRenders += 1;
    let page;
    try {
        const browser = await getBrowser();
        page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: 'domcontentloaded',
            timeout: PAGE_TIMEOUT_MS,
            ...contentOptions,
        });

        const safePdfOptions = { ...pdfOptions };
        delete safePdfOptions.path;
        const pdfBytes = await page.pdf({
            format: 'A4',
            preferCSSPageSize: true,
            timeout: PAGE_TIMEOUT_MS,
            ...safePdfOptions,
        });

        return Buffer.from(pdfBytes);
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
};

const stats = () => ({
    active,
    queued: waiters.length,
    activeRenders,
    renderCount,
    hasBrowser: Boolean(browserPromise),
});

module.exports = { renderPdf, stats };
