const puppeteer = require('puppeteer');
const { customLog } = require('./loggerHelper');
const fs = require('fs');
const path = require('path');

// Global browser instance for reuse (browser pooling)
let globalBrowser = null;
let browserLaunchPromise = null;
const BROWSER_LAUNCH_TIMEOUT = 30000; // 30 seconds

// Clean up /tmp directory to prevent memory issues
const cleanupTempFiles = () => {
    try {
        const tmpDir = '/tmp';
        if (fs.existsSync(tmpDir)) {
            const files = fs.readdirSync(tmpDir);
            // Clean up Chromium-related temp files
            files.forEach(file => {
                if (file.startsWith('puppeteer') || file.startsWith('chrome') || file.endsWith('.pdf')) {
                    try {
                        const filePath = path.join(tmpDir, file);
                        const stats = fs.statSync(filePath);
                        // Only delete files older than 1 hour to avoid deleting active files
                        if (Date.now() - stats.mtimeMs > 3600000) {
                            if (stats.isDirectory()) {
                                fs.rmSync(filePath, { recursive: true, force: true });
                            } else {
                                fs.unlinkSync(filePath);
                            }
                        }
                    } catch (err) {
                        // Ignore errors for individual file cleanup
                    }
                }
            });
        }
    } catch (error) {
        customLog(null, "error", { message: "Error cleaning up temp files", data: error });
    }
};

/**
 * Initialize and return a reusable browser instance (browser pooling)
 * @returns {Promise<Object>} Browser instance
 */
const getBrowser = async () => {
    // If browser is already launched and connected, return it
    if (globalBrowser && globalBrowser.isConnected()) {
        return globalBrowser;
    }

    // If browser is launching, wait for it
    if (browserLaunchPromise) {
        return browserLaunchPromise;
    }

    // Launch new browser
    browserLaunchPromise = (async () => {
        try {
            customLog(null, "info", { message: "Launching global Puppeteer browser instance" });
            
            const browser = await puppeteer.launch({
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-background-networking',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-breakpad',
                    '--disable-component-extensions-with-background-pages',
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                    '--disable-renderer-backgrounding',
                    '--disable-sync',
                    '--metrics-recording-only',
                    '--mute-audio',
                    '--no-first-run',
                    '--safebrowsing-disable-auto-update',
                    '--enable-automation',
                    '--password-store=basic',
                ],
                headless: true,
                ignoreHTTPSErrors: true,
                timeout: BROWSER_LAUNCH_TIMEOUT,
            });

            globalBrowser = browser;

            // Clean up temp files on browser launch
            cleanupTempFiles();

            // Handle browser disconnection
            browser.on('disconnected', () => {
                customLog(null, "info", { message: "Browser disconnected, will relaunch on next request" });
                globalBrowser = null;
                browserLaunchPromise = null;
            });

            customLog(null, "info", { message: "Global Puppeteer browser instance launched successfully" });
            return browser;
        } catch (error) {
            customLog(null, "error", { message: "Failed to launch browser", data: error });
            browserLaunchPromise = null;
            throw error;
        }
    })();

    return browserLaunchPromise;
};

/**
 * Close the global browser instance (for graceful shutdown)
 */
const closeBrowser = async () => {
    if (globalBrowser) {
        try {
            await globalBrowser.close();
            customLog(null, "info", { message: "Global browser instance closed" });
        } catch (error) {
            customLog(null, "error", { message: "Error closing browser", data: error });
        } finally {
            globalBrowser = null;
            browserLaunchPromise = null;
        }
    }
    // Final cleanup of temp files
    cleanupTempFiles();
};

// Hosts that serve web fonts / their CSS. On production these are frequently slow or unreachable
// (no egress / firewall), and a PENDING font request makes page.pdf() hang until the navigation
// timeout — the root cause of the 180000ms "PDF generation timed out" failures (e.g. the airline
// ticket template's Google Fonts <link>s). A PDF must never BLOCK on a remote font.
const FONT_HOST_DENYLIST = ['fonts.googleapis.com', 'fonts.gstatic.com', 'use.typekit.net'];

/**
 * Guard a page against hanging on slow/unreachable external resources during PDF generation.
 * Aborts web-font requests (and their CSS) so Chromium falls back to system fonts immediately,
 * instead of waiting for fonts that never arrive. data: URIs and all other resource types
 * (document, images, layout CSS) are left untouched. Best-effort and never throws.
 */
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
            // Request may already be handled (race) — ignore.
            try { request.continue(); } catch (_) { /* noop */ }
        }
    });
};

/**
 * Generate a PDF from HTML content using Puppeteer with browser pooling.
 * @param {string} html - The HTML content to convert to PDF.
 * @param {Object} options - Optional configurations for PDF generation.
 * @param {boolean} options.landscape - Set to true for landscape orientation.
 * @param {boolean} options.printBackground - Set to true to print background graphics.
 * @param {string} options.filename - Optional filename for the PDF.
 * @param {number} options.timeout - Timeout in milliseconds (default: 120000 for 2 minutes).
 * @param {number} options.imageTimeout - Timeout for image loading in milliseconds (default: 30000 for 30 seconds).
 * @returns {Promise<{status: boolean, buffer?: Buffer, message?: string, fileType?: string}>}
 */
exports.puppeteerPdfBufferGenerator = async ({ html = '', options = {} }) => {
    // Default options for PDF generation
    const defaultOptions = {
        landscape: false,
        format: 'A4',
        preferCSSPageSize: true,
        scale: 1,
    };
    
    // Extract timeout options (default: 2 minutes for complex PDFs like airline tickets)
    const timeout = options.timeout || 120000; // 120 seconds default
    const imageTimeout = options.imageTimeout || 30000; // 30 seconds for images
    
    // Remove timeout from pdfOptions as it's not a PDF option
    // eslint-disable-next-line no-unused-vars
    const { timeout: _, imageTimeout: __, ...pdfOptionsWithoutTimeouts } = options;
    const pdfOptions = { ...defaultOptions, ...pdfOptionsWithoutTimeouts };

    let page = null;
    try {
        customLog(null, "info", {
            message: "Generating PDF with pooled browser",
            htmlLength: html?.length || 0,
            timeout,
            imageTimeout,
            pdfOptions
        });

        // Get or create browser instance (reused across requests)
        const browser = await getBrowser();

        // Create a new page for this request (lightweight operation)
        page = await browser.newPage();
        page.setDefaultNavigationTimeout(timeout);
        page.setDefaultTimeout(timeout);

        // Block external web fonts so a slow/unreachable font CDN can't hang page.pdf() (prod root cause).
        await applyPdfResourceGuards(page);

        // Use domcontentloaded instead of networkidle0 for better performance
        // This avoids waiting for all network requests to finish
        await page.setContent(html, {
            waitUntil: 'domcontentloaded', 
            timeout: timeout 
        });

        // Wait for images to load (but with timeout to avoid hanging)
        await Promise.race([
            page.evaluate(async () => {
                const images = Array.from(document.images || []);
                await Promise.all(
                    images.map((img) => {
                        if (img.complete) return Promise.resolve();
                        return new Promise((resolve) => {
                            const timeout = setTimeout(resolve, 10000); // 10 second timeout per image
                            img.addEventListener("load", () => {
                                clearTimeout(timeout);
                                resolve();
                            }, { once: true });
                            img.addEventListener("error", () => {
                                clearTimeout(timeout);
                                resolve();
                            }, { once: true });
                        });
                    })
                );
            }),
            new Promise((resolve) => setTimeout(resolve, imageTimeout)) // Configurable timeout for all images
        ]);

        // Generate PDF directly to a buffer. page.pdf() returns a Uint8Array (Puppeteer v23+);
        // wrap it in a Node Buffer so downstream Buffer.isBuffer() validation, .toString("base64"),
        // and email attachments all behave correctly.
        const buffer = Buffer.from(await page.pdf(pdfOptions));

        customLog(null, "info", {
            message: "PDF buffer generated successfully",
            bufferSize: buffer?.length || 0
        });
        
        return {
            status: true,
            buffer: buffer,
            fileType: 'application/pdf'
        };
    } catch (error) {
        const errorMessage = error.name === 'TimeoutError' 
            ? `PDF generation timed out after ${timeout}ms. The HTML content may be too complex or contain slow-loading resources.`
            : error.message || 'Something went wrong while generating PDF';
        
        customLog(null, "error", { 
            message: "HTML to pdf conversion failed", 
            errorName: error.name,
            errorMessage: error.message,
            timeout,
            data: error 
        });
        return {
            status: false,
            buffer: Buffer.from('Peko'), // default buffer in case of failure
            fileType: 'application/pdf',
            message: errorMessage
        };
    } finally {
        // Close the page (not the browser) - this is lightweight
        if (page) {
            try {
                await page.close();
            } catch (closeError) {
                customLog(null, "error", { message: "Error closing page", data: closeError });
            }
        }
    }
};

/**
 * Generate a PDF from HTML content and save to file (for admin reports).
 * Uses browser pooling for better performance.
 * @param {string} html - The HTML content to convert to PDF.
 * @param {string} outputFile - Path to save the PDF file.
 * @param {Object} options - Optional configurations for PDF generation.
 * @param {number} options.timeout - Timeout in milliseconds (default: 120000 for 2 minutes).
 * @param {number} options.imageTimeout - Timeout for image loading in milliseconds (default: 30000 for 30 seconds).
 * @returns {Promise<{status: boolean, buffer?: Buffer, message?: string}>}
 */
exports.puppeteerPdfToFile = async ({ html = '', outputFile, options = {} }) => {
    const defaultOptions = {
        landscape: false,
        format: 'A4',
        preferCSSPageSize: true,
        scale: 0.6, // Default scale for reports
    };
    
    const timeout = options.timeout || 120000; // 120 seconds default
    const imageTimeout = options.imageTimeout || 30000; // 30 seconds for images
    
    // Remove timeout from pdfOptions as it's not a PDF option
    // eslint-disable-next-line no-unused-vars
    const { timeout: _, imageTimeout: __, ...pdfOptionsWithoutTimeouts } = options;
    const pdfOptions = { ...defaultOptions, ...pdfOptionsWithoutTimeouts };

    let page = null;
    try {
        customLog(null, "info", {
            message: "Generating PDF to file with pooled browser",
            htmlLength: html?.length || 0,
            outputFile,
            timeout,
            imageTimeout,
            pdfOptions
        });

        // Get or create browser instance (reused across requests)
        const browser = await getBrowser();

        // Create a new page for this request
        page = await browser.newPage();
        page.setDefaultNavigationTimeout(timeout);
        page.setDefaultTimeout(timeout);

        // Block external web fonts so a slow/unreachable font CDN can't hang page.pdf() (prod root cause).
        await applyPdfResourceGuards(page);

        // Use domcontentloaded for better performance
        await page.setContent(html, {
            waitUntil: 'domcontentloaded', 
            timeout: timeout 
        });

        // Wait for images with timeout
        await Promise.race([
            page.evaluate(async () => {
                const images = Array.from(document.images || []);
                await Promise.all(
                    images.map((img) => {
                        if (img.complete) return Promise.resolve();
                        return new Promise((resolve) => {
                            const timeout = setTimeout(resolve, 10000); // 10 second timeout per image
                            img.addEventListener("load", () => {
                                clearTimeout(timeout);
                                resolve();
                            }, { once: true });
                            img.addEventListener("error", () => {
                                clearTimeout(timeout);
                                resolve();
                            }, { once: true });
                        });
                    })
                );
            }),
            new Promise((resolve) => setTimeout(resolve, imageTimeout)) // Configurable timeout for all images
        ]);

        // Generate PDF to file
        await page.pdf({
            ...pdfOptions,
            path: outputFile
        });
        
        // Read the file into buffer
        const buffer = fs.readFileSync(outputFile);
        
        customLog(null, "info", {
            message: "PDF file generated successfully",
            outputFile,
            bufferSize: buffer?.length || 0
        });
        
        return {
            status: true,
            buffer: buffer
        };
    } catch (error) {
        const errorMessage = error.name === 'TimeoutError' 
            ? `PDF generation timed out after ${timeout}ms. The HTML content may be too complex or contain slow-loading resources.`
            : error.message || 'Something went wrong while generating PDF';
        
        customLog(null, "error", { 
            message: "PDF file generation failed", 
            outputFile,
            errorName: error.name,
            errorMessage: error.message,
            timeout,
            data: error 
        });
        return {
            status: false,
            buffer: null,
            message: errorMessage
        };
    } finally {
        // Close the page (not the browser)
        if (page) {
            try {
                await page.close();
            } catch (closeError) {
                customLog(null, "error", { message: "Error closing page", data: closeError });
            }
        }
    }
};

// Export browser management functions for graceful shutdown
exports.closeBrowser = closeBrowser;
exports.getBrowser = getBrowser;
