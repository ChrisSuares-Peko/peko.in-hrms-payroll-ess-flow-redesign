const { missingRequired } = require('../../controllers/corporate/corporateAgreement')
const { reviewChecklistFor } = require('../../constants/kybDocuments')
const { STEP_STATE, deriveKybProgress } = require('../kybProgress')

const COMPLETE_AGREEMENT = {
    entityName: 'Acme Technologies Pvt Ltd',
    regAddress: '12 MG Road',
    regCity: 'Bengaluru',
    regState: 'Karnataka',
    regPinCode: '560001',
    regTelephone: '08012345678',
    regEmail: 'ops@acme.test',
    billSameAsRegistered: true,
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    bankName: 'HDFC Bank',
    bankBranch: 'MG Road',
    bankAccountNumber: '123456789012',
    bankIfsc: 'HDFC0001234',
    bankCity: 'Bengaluru',
    officialContactName: 'Aarav Sharma',
    officialContactMobile: '9876543210',
    officialContactEmail: 'aarav@acme.test',
    salespersonName: 'Riya Nair',
    salespersonMobile: '9876543211',
    salespersonEmail: 'riya@peko.test',
    signatoryName: 'Aarav Sharma',
    signatoryContact: '9876543210',
    signatoryEmail: 'aarav@acme.test',
    signatoryIsPep: false,
}

const PROPRIETORSHIP_DOCS = [
    'GST_Certificate',
    'Signing_Authority_Pan_Card',
    'Signing_Authority_Aadhaar_Card',
    'Cancelled_Cheque',
]

const expectedFor = (businessType) =>
    businessType ? reviewChecklistFor(businessType) : []

const derive = (overrides = {}) => {
    const application = 'application' in overrides ? overrides.application : null
    return deriveKybProgress({
        application: null,
        agreement: null,
        uploadedDocumentNames: [],
        expected: expectedFor(application?.businessType),
        missingRequired,
        ...overrides,
    })
}

const stepFor = (steps, key) => steps.find((entry) => entry.key === key)

describe('deriveKybProgress', () => {
    it('reports every step pending for a corporate that has not started', () => {
        const steps = derive()

        expect(steps.map((entry) => entry.key)).toEqual([
            'business_type',
            'documents',
            'sign_method',
            'agreement_details',
            'agreement_signed',
            'submitted',
        ])
        steps.forEach((entry) => expect(entry.state).toBe(STEP_STATE.PENDING))
    })

    // Every candidate timestamp lands on the one application updatedAt, which the reviewer's own edit
    // bumps, so a date against a step would be invented.
    it('never carries a timestamp, because no per-step time is stored', () => {
        const steps = derive({
            application: { businessType: 'LLP', kybReference: 'KYB123' },
        })

        steps.forEach((entry) => expect(entry).not.toHaveProperty('at'))
    })

    describe('business type', () => {
        it('is done and names the type once chosen', () => {
            const steps = derive({ application: { businessType: 'LLP' } })

            expect(stepFor(steps, 'business_type')).toEqual(
                expect.objectContaining({ state: STEP_STATE.DONE, detail: 'LLP' })
            )
        })
    })

    describe('documents', () => {
        it('cannot judge the checklist before a business type is chosen', () => {
            const steps = derive({ uploadedDocumentNames: ['GST_Certificate'] })

            expect(stepFor(steps, 'documents')).toEqual(
                expect.objectContaining({ state: STEP_STATE.PENDING, detail: expect.stringContaining('business type') })
            )
        })

        it('counts only what this constitution requires', () => {
            const steps = derive({
                application: { businessType: 'PROPRIETORSHIP' },
                uploadedDocumentNames: ['GST_Certificate', 'MOA', 'AOA'],
            })

            expect(stepFor(steps, 'documents')).toEqual(
                expect.objectContaining({
                    state: STEP_STATE.IN_PROGRESS,
                    detail: '1 of 5 required documents uploaded',
                })
            )
        })

        it('is done when every required document is in', () => {
            const steps = derive({
                application: { businessType: 'PROPRIETORSHIP' },
                uploadedDocumentNames: [...PROPRIETORSHIP_DOCS, 'Address_Proof'],
            })

            expect(stepFor(steps, 'documents').state).toBe(STEP_STATE.DONE)
        })

        // The reviewer's row for Address Proof reads Missing, so the step must not read Completed.
        it('counts every required row the reviewer sees, including the address proof', () => {
            const steps = derive({
                application: { businessType: 'PROPRIETORSHIP' },
                uploadedDocumentNames: PROPRIETORSHIP_DOCS,
            })

            expect(stepFor(steps, 'documents').state).toBe(STEP_STATE.IN_PROGRESS)
            expect(stepFor(steps, 'documents').detail).toBe('4 of 5 required documents uploaded')
        })

        it('does not count the agreement, which has a step of its own', () => {
            const steps = derive({
                application: { businessType: 'PROPRIETORSHIP' },
                uploadedDocumentNames: [
                    ...PROPRIETORSHIP_DOCS,
                    'Address_Proof',
                    'Corporate_Agreement',
                    'Corporate_Agreement_Generated',
                ],
            })

            expect(stepFor(steps, 'documents').detail).toBe('5 of 5 required documents uploaded')
        })

        it('does not count the optional Darpan ID against the total', () => {
            const steps = derive({
                application: { businessType: 'SOCIETY_TRUST' },
                uploadedDocumentNames: [...PROPRIETORSHIP_DOCS, 'Business_Pan', 'Address_Proof'],
            })

            expect(stepFor(steps, 'documents').state).toBe(STEP_STATE.DONE)
        })
    })

    describe('signing method', () => {
        it('stays pending while the column is null, rather than assuming the default', () => {
            const steps = derive({ application: { businessType: 'LLP' } })

            expect(stepFor(steps, 'sign_method').state).toBe(STEP_STATE.PENDING)
        })

        it.each([
            ['E_SIGN', 'e-Sign with Aadhaar'],
            ['UPLOAD', 'Upload signed copy'],
        ])('names the %s route', (agreementSignMethod, detail) => {
            const steps = derive({ application: { agreementSignMethod } })

            expect(stepFor(steps, 'sign_method')).toEqual(
                expect.objectContaining({ state: STEP_STATE.DONE, detail })
            )
        })
    })

    describe('agreement details', () => {
        it('is not applicable on the upload route when nothing was ever filled in', () => {
            const steps = derive({ application: { agreementSignMethod: 'UPLOAD' } })

            expect(stepFor(steps, 'agreement_details').state).toBe(STEP_STATE.NOT_APPLICABLE)
        })

        // agreementSignMethod is overwritten by send-for-esign, so it cannot be the deciding evidence.
        it('reports a completed form even after the corporate switched to the upload route', () => {
            const steps = derive({
                application: { agreementSignMethod: 'UPLOAD' },
                agreement: COMPLETE_AGREEMENT,
            })

            expect(stepFor(steps, 'agreement_details')).toEqual(
                expect.objectContaining({ state: STEP_STATE.DONE, detail: expect.stringContaining('before the upload route') })
            )
        })

        it('counts the empty fields while the form is partly filled', () => {
            const steps = derive({
                application: { agreementSignMethod: 'E_SIGN' },
                agreement: { entityName: 'Acme', billSameAsRegistered: true },
            })

            const detailsStep = stepFor(steps, 'agreement_details')
            expect(detailsStep.state).toBe(STEP_STATE.IN_PROGRESS)
            expect(detailsStep.detail).toMatch(/\d+ fields still empty/)
        })

        it('is done once every required field is filled, without waiting for the send', () => {
            const steps = derive({
                application: { agreementSignMethod: 'E_SIGN' },
                agreement: COMPLETE_AGREEMENT,
            })

            expect(stepFor(steps, 'agreement_details').state).toBe(STEP_STATE.DONE)
        })

        it('applies the same billing-mirrors-registered exemption as the send endpoint', () => {
            const steps = derive({
                application: { agreementSignMethod: 'E_SIGN' },
                agreement: { ...COMPLETE_AGREEMENT, billSameAsRegistered: false },
            })

            expect(stepFor(steps, 'agreement_details').state).toBe(STEP_STATE.IN_PROGRESS)
        })
    })

    describe('agreement signed', () => {
        it('is done on the upload route once the signed copy is in', () => {
            const steps = derive({
                application: { agreementSignMethod: 'UPLOAD' },
                uploadedDocumentNames: ['Corporate_Agreement'],
            })

            expect(stepFor(steps, 'agreement_signed')).toEqual(
                expect.objectContaining({ state: STEP_STATE.DONE, detail: expect.stringContaining('uploaded') })
            )
        })

        it('counts a signed copy on file even while the route says e-Sign, and names the conflict', () => {
            const steps = derive({
                application: { agreementSignMethod: 'E_SIGN', esignStatus: 'PENDING_DISPATCH' },
                uploadedDocumentNames: ['Corporate_Agreement'],
            })

            expect(stepFor(steps, 'agreement_signed')).toEqual(
                expect.objectContaining({
                    state: STEP_STATE.DONE,
                    detail: 'Signed copy uploaded, though the route is currently e-Sign',
                })
            )
        })

        it('is not satisfied on the upload route by the system-generated copy', () => {
            const steps = derive({
                application: { agreementSignMethod: 'UPLOAD' },
                uploadedDocumentNames: ['Corporate_Agreement_Generated'],
            })

            expect(stepFor(steps, 'agreement_signed').state).toBe(STEP_STATE.PENDING)
        })

        // No provider is wired, so PENDING_DISPATCH must never read as signed to a reviewer.
        it('says the agreement is generated but not sent while it is queued', () => {
            const steps = derive({
                application: { agreementSignMethod: 'E_SIGN', esignStatus: 'PENDING_DISPATCH' },
            })

            const signedStep = stepFor(steps, 'agreement_signed')
            expect(signedStep.state).toBe(STEP_STATE.IN_PROGRESS)
            expect(signedStep.detail).toBe('Agreement generated, not yet sent for e-signature')
        })

        it('distinguishes actually sent from merely queued', () => {
            const steps = derive({
                application: { agreementSignMethod: 'E_SIGN', esignStatus: 'SENT' },
            })

            expect(stepFor(steps, 'agreement_signed').detail).toBe(
                'Sent for e-signature, awaiting the signature'
            )
        })

        it('is done only when the signature itself came back', () => {
            const steps = derive({
                application: { agreementSignMethod: 'E_SIGN', esignStatus: 'SIGNED' },
            })

            expect(stepFor(steps, 'agreement_signed').state).toBe(STEP_STATE.DONE)
        })

        it('sends the corporate back to try again after a failed e-signature', () => {
            const steps = derive({
                application: { agreementSignMethod: 'E_SIGN', esignStatus: 'FAILED' },
            })

            expect(stepFor(steps, 'agreement_signed').state).toBe(STEP_STATE.PENDING)
        })
    })

    describe('submitted for verification', () => {
        // submitKyb leaves kybStatus on PENDING and only stamps the reference.
        it('reads the stamped reference, not the status', () => {
            const steps = derive({ application: { kybStatus: 'PENDING', kybReference: 'KYB22402C442C' } })

            expect(stepFor(steps, 'submitted')).toEqual(
                expect.objectContaining({ state: STEP_STATE.DONE, detail: 'KYB22402C442C' })
            )
        })

        // A rejected application is back with the corporate, so the journey is not finished.
        it('reports a rejected application as a resubmission in progress', () => {
            const steps = derive({
                application: { kybStatus: 'REJECTED', kybReference: 'KYB123' },
            })

            expect(stepFor(steps, 'submitted')).toEqual(
                expect.objectContaining({
                    state: STEP_STATE.IN_PROGRESS,
                    detail: expect.stringContaining('Rejected'),
                })
            )
        })

        /**
         * REJECTED alone does not say the corporate has picked it up. A reviewer chasing a stalled
         * application needs the two apart, and the reopen is the only signal that distinguishes them.
         */
        it('says the corporate has not started again until they reopen it', () => {
            const steps = derive({
                application: { kybStatus: 'REJECTED', kybReference: 'KYB123', metadata: {} },
            })

            expect(stepFor(steps, 'submitted').detail).toBe(
                'Rejected — waiting for the corporate to start again (KYB123)'
            )
        })

        it('reports it as in progress once they have reopened it', () => {
            const steps = derive({
                application: {
                    kybStatus: 'REJECTED',
                    kybReference: 'KYB123',
                    metadata: { rejectionAcknowledgedAt: '2026-08-02T09:00:00.000Z' },
                },
            })

            expect(stepFor(steps, 'submitted').detail).toBe(
                'Rejected — resubmission in progress (KYB123)'
            )
        })

        it('is pending for a stub application an admin created, despite its PENDING status', () => {
            const steps = derive({ application: { kybStatus: 'PENDING', kybReference: null } })

            expect(stepFor(steps, 'submitted').state).toBe(STEP_STATE.PENDING)
        })
    })
})
