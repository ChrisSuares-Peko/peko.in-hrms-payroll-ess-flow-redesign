const { validateAccountClosureRequest } = require('../accountClosureApi')

const INVALID_REASON = 'Please select a reason for closing the account.'
const DETAILS_REQUIRED = 'Please tell us a little more about why you are leaving.'
const DETAILS_TOO_LONG = 'The details must be 1000 characters or fewer.'
const DETAILS_TOO_SHORT = 'The details must be at least 10 characters.'

const run = (req) => {
    const next = jest.fn()
    validateAccountClosureRequest(req, {}, next)
    return next
}

const validating = (body) => run({ body })

const rejectedWith = (message) => expect.objectContaining({ status_code: 400, message })

describe('validateAccountClosureRequest', () => {
    describe('reason', () => {
        it('accepts a reason from the catalogue', () => {
            expect(validating({ reason: 'NOT_USING' })).toHaveBeenCalledWith()
        })

        it('accepts a lowercase reason, as the controller always has', () => {
            expect(validating({ reason: 'not_using' })).toHaveBeenCalledWith()
        })

        it('refuses a reason that is not in the catalogue', () => {
            expect(validating({ reason: 'BECAUSE' })).toHaveBeenCalledWith(
                rejectedWith(INVALID_REASON)
            )
        })

        it('refuses a missing reason', () => {
            expect(validating({})).toHaveBeenCalledWith(rejectedWith(INVALID_REASON))
        })

        it('refuses an empty reason', () => {
            expect(validating({ reason: '   ' })).toHaveBeenCalledWith(
                rejectedWith(INVALID_REASON)
            )
        })

        it('refuses a non-string reason', () => {
            expect(validating({ reason: 42 })).toHaveBeenCalledWith(rejectedWith(INVALID_REASON))
        })

        it('tolerates a request with no body at all', () => {
            expect(run({})).toHaveBeenCalledWith(rejectedWith(INVALID_REASON))
        })
    })

    describe('details length', () => {
        it('refuses details longer than the maximum', () => {
            expect(
                validating({ reason: 'NOT_USING', details: 'x'.repeat(1001) })
            ).toHaveBeenCalledWith(rejectedWith(DETAILS_TOO_LONG))
        })

        it('accepts details exactly at the maximum', () => {
            expect(
                validating({ reason: 'NOT_USING', details: 'x'.repeat(1000) })
            ).toHaveBeenCalledWith()
        })

        it('refuses details shorter than the minimum', () => {
            expect(
                validating({ reason: 'NOT_USING', details: 'too short' })
            ).toHaveBeenCalledWith(rejectedWith(DETAILS_TOO_SHORT))
        })

        it('accepts details exactly at the minimum', () => {
            expect(
                validating({ reason: 'NOT_USING', details: 'a'.repeat(10) })
            ).toHaveBeenCalledWith()
        })

        it('measures the minimum after trimming, so padding cannot pad it out', () => {
            expect(
                validating({ reason: 'NOT_USING', details: `   ${'a'.repeat(9)}   ` })
            ).toHaveBeenCalledWith(rejectedWith(DETAILS_TOO_SHORT))
        })
    })

    describe('details when the reason is Others', () => {
        it('requires an explanation', () => {
            expect(validating({ reason: 'OTHERS' })).toHaveBeenCalledWith(
                rejectedWith(DETAILS_REQUIRED)
            )
        })

        it('treats whitespace-only text as no explanation at all', () => {
            expect(validating({ reason: 'OTHERS', details: '   ' })).toHaveBeenCalledWith(
                rejectedWith(DETAILS_REQUIRED)
            )
        })

        it('still enforces the minimum on a real explanation', () => {
            expect(validating({ reason: 'OTHERS', details: 'too short' })).toHaveBeenCalledWith(
                rejectedWith(DETAILS_TOO_SHORT)
            )
        })

        it('accepts an explanation that satisfies every rule', () => {
            expect(
                validating({ reason: 'OTHERS', details: 'Acquired by another group' })
            ).toHaveBeenCalledWith()
        })
    })

    describe('details when the reason is not Others', () => {
        it('accepts an omitted explanation', () => {
            expect(validating({ reason: 'TOO_EXPENSIVE' })).toHaveBeenCalledWith()
        })

        it('accepts an empty explanation', () => {
            expect(validating({ reason: 'TOO_EXPENSIVE', details: '' })).toHaveBeenCalledWith()
        })

        it('accepts a whitespace-only explanation as empty', () => {
            expect(validating({ reason: 'TOO_EXPENSIVE', details: '   ' })).toHaveBeenCalledWith()
        })
    })

    it('ignores fields it does not know about', () => {
        expect(validating({ reason: 'NOT_USING', somethingElse: true })).toHaveBeenCalledWith()
    })
})
