const os = require('os')

const libre = require('libreoffice-convert')

const { customLog } = require('../utils/loggerHelper')

const PDF_MAGIC = '%PDF-'

/**
 * A cold soffice start is a second or two; a warm one is well under that. The deadline is generous
 * enough not to fail a legitimate cold start and short enough that a wedged process frees its slot.
 */
const CONVERSION_TIMEOUT_MS = 20000

/**
 * libreoffice-convert gives every conversion its own UserInstallation profile in a temp dir, so
 * conversions do not clash and can run in parallel. They are still CPU-bound and each spawns a
 * process, so the pool is small and tied to the machine rather than unbounded.
 */
const MAX_CONCURRENT = Math.max(1, Math.min(4, (os.cpus()?.length || 2) - 1))

/**
 * Past this, shed load instead of queueing: a caller that waits behind fifty conversions has already
 * timed out at the gateway, and the queue would just hold sockets and memory open.
 */
const MAX_QUEUED = 24

let active = 0
const waiting = []

const stats = () => ({ active, queued: waiting.length, maxConcurrent: MAX_CONCURRENT })

const acquire = () =>
    new Promise((resolve, reject) => {
        if (active < MAX_CONCURRENT) {
            active += 1
            return resolve()
        }
        if (waiting.length >= MAX_QUEUED) {
            return reject(
                new Error(`Too many PDF conversions are already queued (${waiting.length}).`)
            )
        }
        return waiting.push({ resolve, reject })
    })

const release = () => {
    const next = waiting.shift()
    if (next) return next.resolve()
    active -= 1
    return undefined
}

/**
 * execOptions carries the timeout so the child is actually killed. Without it execFile waits forever,
 * and on a RAM-backed /tmp every abandoned conversion leaves its profile behind until the box OOMs.
 */
const convert = (buffer, format) =>
    new Promise((resolve, reject) => {
        let settled = false
        const deadline = setTimeout(() => {
            settled = true
            reject(new Error(`The PDF conversion did not finish within ${CONVERSION_TIMEOUT_MS}ms.`))
        }, CONVERSION_TIMEOUT_MS + 1000)

        libre.convertWithOptions(
            buffer,
            format,
            undefined,
            { execOptions: { timeout: CONVERSION_TIMEOUT_MS, killSignal: 'SIGKILL' } },
            (error, result) => {
                if (settled) return undefined
                clearTimeout(deadline)
                settled = true
                if (error) return reject(error)
                return resolve(result)
            }
        )
    })

/**
 * Converts a .docx buffer to PDF.
 *
 * Verifies the result really is a PDF before returning it: LibreOffice can exit successfully having
 * written nothing useful, and a "PDF" that is not one reaches the customer as a corrupt download.
 */
const docxToPdf = async (docxBuffer, req) => {
    if (!Buffer.isBuffer(docxBuffer) || !docxBuffer.length) {
        throw new Error('Nothing to convert to PDF.')
    }

    await acquire()
    const startedAt = Date.now()

    try {
        const pdf = await convert(docxBuffer, '.pdf')

        if (!Buffer.isBuffer(pdf) || !pdf.length) {
            throw new Error('The PDF conversion produced no output.')
        }
        if (pdf.subarray(0, PDF_MAGIC.length).toString('latin1') !== PDF_MAGIC) {
            throw new Error('The PDF conversion produced something that is not a PDF.')
        }

        customLog(req?.LogTraceId, 'info', {
            message: '[DocumentPdf] Converted a document to PDF',
            ms: Date.now() - startedAt,
            bytes: pdf.length,
            ...stats(),
        })

        return pdf
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[DocumentPdf] PDF conversion failed',
            ms: Date.now() - startedAt,
            error: error?.message,
            ...stats(),
        })
        throw error
    } finally {
        release()
    }
}

module.exports = { docxToPdf, stats, PDF_MAGIC, CONVERSION_TIMEOUT_MS, MAX_CONCURRENT, MAX_QUEUED }
