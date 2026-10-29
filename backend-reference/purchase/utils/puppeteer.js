'use strict';

const puppeteer = require('puppeteer');
const { customLog } = require('./loggerHelper');

/**
 * Generate a PDF from HTML content using Puppeteer.
 * @param {string} html - The HTML content to convert to PDF.
 * @param {Object} options - Optional configurations for PDF generation.
 * @param {boolean} options.landscape - Set to true for landscape orientation.
 * @param {boolean} options.printBackground - Set to true to print background graphics.
 * @param {number} options.timeout - Timeout in milliseconds (default 120000).
 * @param {number} options.imageTimeout - Timeout for image loading in milliseconds (default 30000).
 * @returns {Promise<{status: boolean, buffer?: Buffer | null, message?: string, fileType?: string}>}
 */
exports.puppeteerPdfBufferGenerator = async ({ html = '', options = {} }) => {
    const defaultOptions = {
        landscape: false,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
    };
    const timeout = options.timeout || 120000;
    const imageTimeout = options.imageTimeout || 30000;
    const pdfOptionOverrides = { ...options };
    delete pdfOptionOverrides.timeout;
    delete pdfOptionOverrides.imageTimeout;
    const pdfOptions = { ...defaultOptions, ...pdfOptionOverrides };

    let browser;
    try {
        customLog(null, 'info', {
            message: '[PDF] Launching Puppeteer',
            htmlLength: html?.length || 0,
            timeout,
            imageTimeout,
            pdfOptions,
        });

        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(timeout);
        page.setDefaultTimeout(timeout);

        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout });

        // Wait for images to load, but don't block indefinitely
        await Promise.race([
            page.evaluate(async () => {
                const images = Array.from(document.images || []);
                await Promise.all(
                    images.map((img) => {
                        if (img.complete) return Promise.resolve();
                        return new Promise((resolve) => {
                            const timeoutId = setTimeout(resolve, 10000);
                            img.addEventListener('load', () => { clearTimeout(timeoutId); resolve(); }, { once: true });
                            img.addEventListener('error', () => { clearTimeout(timeoutId); resolve(); }, { once: true });
                        });
                    })
                );
            }),
            new Promise((resolve) => setTimeout(resolve, imageTimeout)),
        ]);

        const pdfOutput = await page.pdf(pdfOptions);
        const pdfBuffer = Buffer.isBuffer(pdfOutput) ? pdfOutput : Buffer.from(pdfOutput);

        customLog(null, 'info', {
            message: '[PDF] Buffer generated',
            bufferSize: pdfBuffer?.length || 0,
            isBuffer: Buffer.isBuffer(pdfBuffer),
        });

        return { status: true, buffer: pdfBuffer, fileType: 'application/pdf' };
    } catch (error) {
        const errorMessage = error.name === 'TimeoutError'
            ? `PDF generation timed out after ${timeout}ms`
            : error.message || 'Something went wrong while generating PDF';
        customLog(null, 'error', {
            message: '[PDF] Generation failed',
            errorName: error.name,
            errorMessage,
        });
        return { status: false, buffer: null, fileType: 'application/pdf', message: errorMessage };
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                customLog(null, 'error', { message: '[PDF] Error closing browser', error: closeError?.message });
            }
        }
    }
};
