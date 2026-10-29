const libre = require('libreoffice-convert')

const {
    docxToPdf,
    stats,
    CONVERSION_TIMEOUT_MS,
    MAX_CONCURRENT,
    MAX_QUEUED,
} = require('../documentPdf')

jest.mock('libreoffice-convert', () => ({ convertWithOptions: jest.fn() }))
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const pdf = (body = 'body') => Buffer.from(`%PDF-1.7\n${body}`)
const done = (cb, err, result) => setImmediate(() => cb(err, result))

const succeedWith = (buffer) =>
    libre.convertWithOptions.mockImplementation((input, format, filter, options, cb) =>
        done(cb, null, buffer)
    )

const settle = (promise) => promise.then((value) => value, (error) => error)

describe('docxToPdf', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        succeedWith(pdf())
    })

    it('converts a .docx buffer to PDF', async () => {
        const out = await docxToPdf(Buffer.from('docx'))

        expect(out.subarray(0, 5).toString()).toBe('%PDF-')
    })

    // Without a timeout in execOptions the child is never killed, and on a RAM-backed /tmp every
    // abandoned conversion leaves its profile behind.
    it('tells LibreOffice to kill the process rather than waiting forever', async () => {
        await docxToPdf(Buffer.from('docx'))

        expect(libre.convertWithOptions).toHaveBeenCalledWith(
            expect.any(Buffer),
            '.pdf',
            undefined,
            { execOptions: { timeout: CONVERSION_TIMEOUT_MS, killSignal: 'SIGKILL' } },
            expect.any(Function)
        )
    })

    it('reports a conversion failure instead of returning nothing', async () => {
        libre.convertWithOptions.mockImplementation((i, f, fl, o, cb) =>
            done(cb, new Error('Could not find soffice binary'))
        )

        await expect(docxToPdf(Buffer.from('docx'))).rejects.toThrow(/soffice binary/)
    })

    it('refuses output that is not a PDF', async () => {
        succeedWith(Buffer.from('<html>error page</html>'))

        await expect(docxToPdf(Buffer.from('docx'))).rejects.toThrow(/not a PDF/i)
    })

    it('refuses empty output', async () => {
        succeedWith(Buffer.alloc(0))

        await expect(docxToPdf(Buffer.from('docx'))).rejects.toThrow(/no output/i)
    })

    it('refuses to convert nothing', async () => {
        await expect(docxToPdf(null)).rejects.toThrow(/Nothing to convert/i)
        expect(libre.convertWithOptions).not.toHaveBeenCalled()
    })

    describe('under load', () => {
        it('runs conversions in parallel up to the pool size, never beyond it', async () => {
            let running = 0
            let peak = 0
            libre.convertWithOptions.mockImplementation((i, f, fl, o, cb) => {
                running += 1
                peak = Math.max(peak, running)
                setTimeout(() => {
                    running -= 1
                    cb(null, pdf())
                }, 5)
            })

            await Promise.all(
                Array.from({ length: MAX_CONCURRENT * 3 }, () => docxToPdf(Buffer.from('x')))
            )

            expect(peak).toBe(MAX_CONCURRENT)
            expect(libre.convertWithOptions).toHaveBeenCalledTimes(MAX_CONCURRENT * 3)
        })

        // A caller waiting behind a full queue has already timed out at the gateway.
        it('sheds load instead of queueing without limit', async () => {
            libre.convertWithOptions.mockImplementation((i, f, fl, o, cb) =>
                setTimeout(() => cb(null, pdf()), 20)
            )

            const total = MAX_CONCURRENT + MAX_QUEUED + 5
            const results = await Promise.all(
                Array.from({ length: total }, () => settle(docxToPdf(Buffer.from('x'))))
            )

            const shed = results.filter(r => r instanceof Error && /already queued/i.test(r.message))
            expect(shed.length).toBeGreaterThan(0)
            expect(results.filter(r => Buffer.isBuffer(r)).length).toBe(total - shed.length)
        })

        it('frees its slot after a failure, so the pool does not leak capacity', async () => {
            libre.convertWithOptions.mockImplementationOnce((i, f, fl, o, cb) =>
                done(cb, new Error('boom'))
            )

            await expect(docxToPdf(Buffer.from('a'))).rejects.toThrow('boom')
            await expect(docxToPdf(Buffer.from('b'))).resolves.toBeInstanceOf(Buffer)
            expect(stats().active).toBe(0)
            expect(stats().queued).toBe(0)
        })

        it('is idle again once everything has drained', async () => {
            await Promise.all(Array.from({ length: 6 }, () => docxToPdf(Buffer.from('x'))))

            expect(stats()).toEqual(
                expect.objectContaining({ active: 0, queued: 0, maxConcurrent: MAX_CONCURRENT })
            )
        })
    })
})
