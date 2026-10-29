const {
    BUSINESS_TYPES,
    BUSINESS_TYPE_CHECKLISTS,
    ALL_DOCUMENT_NAMES,
    checklistFor,
    reviewChecklistFor,
    serializeDocument,
} = require('../kybDocuments')
const { documentNames } = require('../../controllers/corporate/corporateDocuments')

const labelsFor = (businessType) => checklistFor(businessType).documents.map((doc) => doc.label)

describe('KYB business type checklists', () => {
    // Private and Public Limited are separate so each maps to one printed option on Pine Labs' form.
    it('offers one constitution per option printed on the agreement form', () => {
        expect(BUSINESS_TYPES).toEqual([
            'PRIVATE_LIMITED',
            'PUBLIC_LIMITED',
            'LLP',
            'PARTNERSHIP',
            'PROPRIETORSHIP',
            'SOCIETY_TRUST',
        ])
    })

    it('labels them as the dropdown does', () => {
        expect(BUSINESS_TYPE_CHECKLISTS.map((entry) => entry.label)).toEqual([
            'Private Limited',
            'Public Limited',
            'LLP',
            'Partnership',
            'Proprietorship',
            'Society / Trust',
        ])
    })

    // Applications saved before the split must still resolve to a checklist.
    it('still resolves the retired combined type', () => {
        expect(checklistFor('PRIVATE_PUBLIC_LIMITED').value).toBe('PRIVATE_LIMITED')
    })

    it('asks a public limited company for the same eight documents as a private one', () => {
        expect(labelsFor('PUBLIC_LIMITED')).toEqual(labelsFor('PRIVATE_LIMITED'))
    })

    it('asks a private limited company for all eight documents', () => {
        expect(labelsFor('PRIVATE_LIMITED')).toEqual([
            'Certificate of Incorporation',
            'MoA (Memorandum of Association)',
            'AoA (Articles of Association)',
            'Company PAN',
            'GST Certificate',
            'Signing Authority PAN Card',
            'Signing Authority Aadhaar Card (Masked)',
            'Cancelled Cheque',
        ])
    })

    it('swaps MoA/AoA for the LLP agreement', () => {
        const llp = labelsFor('LLP')

        expect(llp).toContain('LLP Agreement / Deed')
        expect(llp).not.toContain('MoA (Memorandum of Association)')
        expect(llp).not.toContain('AoA (Articles of Association)')
    })

    // A partnership is not incorporated, so there is no certificate to ask for.
    it('asks a partnership for the deed and no certificate of incorporation', () => {
        const partnership = labelsFor('PARTNERSHIP')

        expect(partnership).toContain('Partnership Deed')
        expect(partnership).not.toContain('Certificate of Incorporation')
    })

    it('asks a proprietorship for the four documents it can produce', () => {
        expect(labelsFor('PROPRIETORSHIP')).toEqual([
            'GST Certificate',
            'Signing Authority PAN Card',
            'Signing Authority Aadhaar Card (Masked)',
            'Cancelled Cheque',
        ])
    })

    it('asks a society or trust for the business PAN and Darpan ID', () => {
        const society = labelsFor('SOCIETY_TRUST')

        expect(society).toContain('Business PAN Card')
        expect(society).toContain('Darpan ID')
        expect(society).not.toContain('Company PAN')
    })

    it('returns null for an unknown business type rather than a default checklist', () => {
        expect(checklistFor('SOMETHING_NEW')).toBeNull()
        expect(checklistFor(undefined)).toBeNull()
    })

    describe('required flag', () => {
        it('marks Darpan ID optional and everything else required', () => {
            const society = checklistFor('SOCIETY_TRUST').documents.map(serializeDocument)

            expect(society.filter((doc) => !doc.required).map((doc) => doc.label)).toEqual([
                'Darpan ID',
            ])
        })

        it('defaults a document with no explicit flag to required', () => {
            expect(serializeDocument({ key: 'x', label: 'X' }).required).toBe(true)
        })
    })

    describe('upload whitelist', () => {
        // The whitelist is both the write gate and the reviewer's read filter, so a checklist document
        // missing from it is one the corporate cannot upload and the reviewer cannot see.
        it('accepts every document any checklist can ask for', () => {
            BUSINESS_TYPE_CHECKLISTS.forEach((entry) => {
                entry.documents.forEach((doc) => {
                    expect(ALL_DOCUMENT_NAMES).toContain(doc.documentName)
                })
            })
        })

        it('still accepts the corporate agreement, which no checklist lists', () => {
            expect(ALL_DOCUMENT_NAMES).toContain('Corporate_Agreement')
        })

        it('is what the upload controller actually enforces', () => {
            expect(documentNames).toEqual(ALL_DOCUMENT_NAMES)
        })

        it('lists each name once', () => {
            expect(new Set(ALL_DOCUMENT_NAMES).size).toBe(ALL_DOCUMENT_NAMES.length)
        })
    })

    it('gives every document a stable key, name, label and hint', () => {
        BUSINESS_TYPE_CHECKLISTS.forEach((entry) => {
            entry.documents.map(serializeDocument).forEach((doc) => {
                expect(doc.key).toBeTruthy()
                expect(doc.documentName).toMatch(/^[A-Za-z_]+$/)
                expect(doc.label).toBeTruthy()
                expect(doc.hint).toBeTruthy()
                expect(doc.uploadLabel).toBeTruthy()
            })
        })
    })

    describe('per-document size caps', () => {
        const { maxSizeKbFor, DEFAULT_MAX_SIZE_KB } = require('../kybDocuments')

        it('gives every document a cap', () => {
            BUSINESS_TYPE_CHECKLISTS.forEach((entry) => {
                entry.documents.map(serializeDocument).forEach((doc) => {
                    expect(doc.maxSizeKb).toBeGreaterThan(0)
                })
            })
        })

        it('matches the agreed per-document limits', () => {
            expect(maxSizeKbFor('Certificate_Of_Incorporation')).toBe(500)
            expect(maxSizeKbFor('MOA')).toBe(10240)
            expect(maxSizeKbFor('AOA')).toBe(10240)
            expect(maxSizeKbFor('LLP_Agreement')).toBe(10240)
            expect(maxSizeKbFor('Partnership_Deed')).toBe(10240)
            expect(maxSizeKbFor('Company_Pan')).toBe(2048)
            expect(maxSizeKbFor('Business_Pan')).toBe(2048)
            expect(maxSizeKbFor('GST_Certificate')).toBe(2048)
            expect(maxSizeKbFor('Signing_Authority_Pan_Card')).toBe(500)
            expect(maxSizeKbFor('Signing_Authority_Aadhaar_Card')).toBe(500)
            expect(maxSizeKbFor('Cancelled_Cheque')).toBe(500)
            expect(maxSizeKbFor('Darpan_Id')).toBe(500)
            expect(maxSizeKbFor('Corporate_Agreement')).toBe(2048)
            expect(maxSizeKbFor('Address_Proof')).toBe(500)
        })

        it('falls back to the default for a name it does not know', () => {
            expect(maxSizeKbFor('Not_A_Document')).toBe(DEFAULT_MAX_SIZE_KB)
        })
    })

    describe('the reviewer list', () => {
        it("holds an LLP to its own documents, plus the agreement and address proof", () => {
            const names = reviewChecklistFor('LLP').map((entry) => entry.documentName)

            expect(names).toContain('LLP_Agreement')
            expect(names).toContain('Address_Proof')
            expect(names).not.toContain('MOA')
            expect(names).not.toContain('Partnership_Deed')
        })

        it('requires the address proof of every constitution', () => {
            BUSINESS_TYPES.forEach((businessType) => {
                const proof = reviewChecklistFor(businessType).find(
                    (entry) => entry.documentName === 'Address_Proof'
                )
                expect(proof).toEqual(expect.objectContaining({ required: true }))
            })
        })

        const agreementRow = (options) =>
            reviewChecklistFor('LLP', [], options).find(
                (entry) => entry.documentName === 'Corporate_Agreement'
            )

        it('requires the uploaded agreement only on the upload route', () => {
            expect(agreementRow({ agreementSignMethod: 'UPLOAD' })).toEqual(
                expect.objectContaining({ required: true })
            )
        })

        it('does not list the uploaded agreement at all for a corporate signing by e-Sign', () => {
            expect(agreementRow({ agreementSignMethod: 'E_SIGN' })).toBeUndefined()
        })

        it('does not list the uploaded agreement before a signing route is chosen', () => {
            expect(agreementRow({})).toBeUndefined()
        })

        it('lists an agreement that was actually uploaded even after the route moved to e-Sign', () => {
            const row = reviewChecklistFor('LLP', ['Corporate_Agreement'], {
                agreementSignMethod: 'E_SIGN',
            }).find((entry) => entry.documentName === 'Corporate_Agreement')

            expect(row).toEqual(expect.objectContaining({ required: false }))
        })

        it('keeps the e-signed copy listed on the e-Sign route so a reviewer can open it', () => {
            const names = reviewChecklistFor('LLP', [], { agreementSignMethod: 'E_SIGN' }).map(
                (entry) => entry.documentName
            )

            expect(names).toContain('Corporate_Agreement_Signed')
        })

        it('stops requiring the address proof once the corporate declared it is the GST address', () => {
            BUSINESS_TYPES.forEach((businessType) => {
                const proof = reviewChecklistFor(businessType, [], {
                    addressProofSameAsGst: true,
                }).find((entry) => entry.documentName === 'Address_Proof')

                expect(proof).toEqual(expect.objectContaining({ required: false }))
            })
        })

        it('still lists the address proof row when it is declared, so a reviewer sees the decision', () => {
            const names = reviewChecklistFor('LLP', [], { addressProofSameAsGst: true }).map(
                (entry) => entry.documentName
            )

            expect(names).toContain('Address_Proof')
        })

        it('leaves every other document required when the address proof is declared', () => {
            const entries = reviewChecklistFor('PRIVATE_LIMITED', [], { addressProofSameAsGst: true })
            const companyPan = entries.find((entry) => entry.documentName === 'Company_Pan')

            expect(companyPan).toEqual(expect.objectContaining({ required: true }))
        })

        it('includes the system-generated agreement so a reviewer can open it', () => {
            const names = reviewChecklistFor('PROPRIETORSHIP').map((entry) => entry.documentName)

            expect(names).toContain('Corporate_Agreement_Generated')
        })

        // Without a business type there is no checklist to hold the corporate to.
        it('shows only what was uploaded, plus the agreement documents, when the type is unknown', () => {
            const names = reviewChecklistFor(null, ['Company_Pan'], {
                agreementSignMethod: 'UPLOAD',
            }).map((entry) => entry.documentName)

            expect(names).toEqual([
                'Company_Pan',
                'Corporate_Agreement',
                'Address_Proof',
                'Corporate_Agreement_Generated',
                'Corporate_Agreement_Signed',
            ])
        })

        it('omits the manual agreement row entirely when no signing route is set', () => {
            const names = reviewChecklistFor(null, ['Company_Pan']).map((entry) => entry.documentName)

            expect(names).toEqual([
                'Company_Pan',
                'Address_Proof',
                'Corporate_Agreement_Generated',
                'Corporate_Agreement_Signed',
            ])
        })

        it('never lists a document twice when an uploaded one is also agreement-scoped', () => {
            const names = reviewChecklistFor(null, ['Corporate_Agreement']).map((e) => e.documentName)

            expect(names).toEqual([...new Set(names)])
        })
    })
})
