jest.mock('../../../services/agreementEsign', () => ({
    applyTerminalStatus: jest.fn(),
    dispatch: jest.fn(),
    refreshEsignStatus: jest.fn(),
}))

const { applyTerminalStatus } = require('../../../services/agreementEsign')
const { updateAgreementEsignStatus } = require('../esignStatus')
const { verifyCallbackSecret } = require('../../../routes/API/v1/webhook/corporateCardESign')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const payload = (res) => res.json.mock.calls[0][0]
const statusOf = (res) => res.status.mock.calls[0][0]

beforeEach(() => {
    jest.clearAllMocks()
    applyTerminalStatus.mockResolvedValue({ applied: true, status: 'SIGNED' })
    process.env.ESIGN_CALLBACK_SECRET = 'REDACTED'
})

describe('verifyCallbackSecret', () => {
    const call = (headers, params = { webhookUser: 'officeandbusiness' }) => {
        const res = buildRes()
        const next = jest.fn()
        verifyCallbackSecret({ headers, params, originalUrl: '/x' }, res, next)
        return { res, next }
    }

    it('admits a call carrying the shared secret', () => {
        const { next, res } = call({ 'x-esign-callback-secret': 'shared-secret' })

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('rejects a call with the wrong secret', () => {
        const { next, res } = call({ 'x-esign-callback-secret': 'guessed' })

        expect(next).not.toHaveBeenCalled()
        expect(statusOf(res)).toBe(401)
    })

    it('rejects a call carrying no secret at all', () => {
        const { next, res } = call({})

        expect(next).not.toHaveBeenCalled()
        expect(statusOf(res)).toBe(401)
    })

    it('rejects a caller announcing itself as another service', () => {
        const { next, res } = call({ 'x-esign-callback-secret': 'shared-secret' }, { webhookUser: 'pinelabs' })

        expect(next).not.toHaveBeenCalled()
        expect(statusOf(res)).toBe(401)
    })

    it('refuses to serve the route at all when no secret is configured', () => {
        delete process.env.ESIGN_CALLBACK_SECRET

        const { next, res } = call({})

        expect(next).not.toHaveBeenCalled()
        expect(statusOf(res)).toBe(503)
    })

    it('does not admit a call whose header is the literal string undefined', () => {
        delete process.env.ESIGN_CALLBACK_SECRET

        const { next } = call({ 'x-esign-callback-secret': undefined })

        expect(next).not.toHaveBeenCalled()
    })
})

describe('updateAgreementEsignStatus', () => {
    const send = async (body) => {
        const res = buildRes()
        await updateAgreementEsignStatus({ body, headers: {} }, res, jest.fn())
        return res
    }

    it('applies a signature to the corporate it names', async () => {
        const res = await send({ corporateId: '42', epakId: 'EPAK-1', status: 'SIGNED', signedPdfBase64: 'Zm9v' })

        expect(applyTerminalStatus).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            epakId: 'EPAK-1',
            status: 'SIGNED',
            signedPdfBase64: 'Zm9v',
        }))
        expect(statusOf(res)).toBe(200)
    })

    it('turns a decline into a failure with a message the corporate can read', async () => {
        await send({ corporateId: '42', epakId: 'EPAK-1', status: 'FAILED', reason: 'DECLINED' })

        expect(applyTerminalStatus).toHaveBeenCalledWith(expect.objectContaining({
            status: 'FAILED',
            reason: 'The authorised signatory declined the agreement.',
        }))
    })

    it('treats any status that is not SIGNED as a failure', async () => {
        await send({ corporateId: '42', epakId: 'EPAK-1', status: 'WHATEVER' })

        expect(applyTerminalStatus).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED' }))
    })

    it('rejects a callback that names no envelope', async () => {
        const res = await send({ corporateId: '42', status: 'SIGNED' })

        expect(statusOf(res)).toBe(400)
        expect(applyTerminalStatus).not.toHaveBeenCalled()
    })

    it('reports back what the service decided, so a stale envelope is visible upstream', async () => {
        applyTerminalStatus.mockResolvedValue({ applied: false, ignored: 'stale-envelope' })

        const res = await send({ corporateId: '42', epakId: 'EPAK-OLD', status: 'SIGNED' })

        expect(statusOf(res)).toBe(200)
        expect(payload(res).data).toEqual({ applied: false, ignored: 'stale-envelope' })
    })
})
