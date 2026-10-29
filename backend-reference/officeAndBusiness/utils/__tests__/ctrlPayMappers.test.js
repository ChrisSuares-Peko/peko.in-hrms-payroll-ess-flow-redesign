const {
    isChecklistComplete,
    istToIso,
    paiseToRupees,
    toBalance,
    toChecklist,
    toWalletTransaction,
} = require('../ctrlPay/mappers');

const CHECKLIST = {
    constitution_code: 'D',
    constitution_description: 'Private Limited Company',
    doc_requirement: 'all',
    document_type: [
        { CERTIFICATE_OF_INCORPORATION: { status: 'UPLOADED', remarks: null, name: 'Certificate of Incorporation' } },
        { MEMORANDUM_AND_ARTICLES_OF_ASSOCIATION: { status: 'REJECTED', remarks: 'Blurred scan', name: 'MOA & AOA' } },
    ],
    pan_card: { status: 'VERIFIED', required: true, name: 'PAN card of Legal Entity', remarks: null },
    ovd: { status: 'NOT_UPLOADED', required: false, name: 'Officially Valid Document', remarks: null, type: null },
    ovd_back: { status: 'NOT_UPLOADED', required: false, name: 'Officially Valid Document (Back Page)', remarks: null },
};

describe('CTRLPay mappers', () => {
    it('converts paise, integer or string, to rupees', () => {
        expect(paiseToRupees(2500000)).toBe(25000);
        expect(paiseToRupees('2500050')).toBe(25000.5);
        expect(paiseToRupees(null)).toBeNull();
        expect(paiseToRupees('n/a')).toBeNull();
    });

    it('reads IST timestamps as instants', () => {
        expect(istToIso('2026-10-12 11:42:07.512345')).toBe('2026-10-12T06:12:07.512Z');
        expect(istToIso('2026-10-12 11:42:07')).toBe('2026-10-12T06:12:07.000Z');
        expect(istToIso('yesterday')).toBeNull();
    });

    it('flattens the document checklist and keys entity documents by file name', () => {
        const checklist = toChecklist(CHECKLIST);

        expect(checklist.requirement).toBe('all');
        expect(checklist.panCard).toEqual({
            fileName: 'pan_card',
            name: 'PAN card of Legal Entity',
            status: 'VERIFIED',
            remarks: null,
            required: true,
        });
        expect(checklist.entityDocuments.map((document) => document.fileName)).toEqual([
            'CERTIFICATE_OF_INCORPORATION',
            'MEMORANDUM_AND_ARTICLES_OF_ASSOCIATION',
        ]);
        expect(checklist.entityDocuments[1].remarks).toBe('Blurred scan');
        expect(checklist.ovd).toMatchObject({ fileName: 'ovd_of_ubo', required: false, ovdType: null });
    });

    it('treats the checklist as complete only when every required document is in', () => {
        expect(isChecklistComplete(toChecklist(CHECKLIST))).toBe(false);

        const fixed = toChecklist({
            ...CHECKLIST,
            document_type: [CHECKLIST.document_type[0]],
        });
        expect(isChecklistComplete(fixed)).toBe(true);
    });

    it('needs one business proof and both identity sides for a proprietor', () => {
        const proprietor = (overrides) =>
            toChecklist({
                doc_requirement: 'any',
                document_type: [
                    { UDYAM_REGISTRATION_CERTIFICATE: { status: 'NOT_UPLOADED', name: 'Udyam' } },
                    { UTILITY_BILL: { status: 'UPLOADED', name: 'Utility bill' } },
                ],
                pan_card: { status: 'UPLOADED', required: true },
                ovd: { status: 'UPLOADED', required: true, type: 'PASSPORT' },
                ovd_back: { status: 'NOT_UPLOADED', required: true },
                ...overrides,
            });

        expect(isChecklistComplete(proprietor({}))).toBe(false);
        expect(isChecklistComplete(proprietor({ ovd_back: { status: 'UPLOADED', required: true } }))).toBe(true);
    });

    it('maps a transaction row to the wallet shape, keeping failure codes on the reference', () => {
        expect(
            toWalletTransaction({
                name: 'CTRL0001',
                transaction_id: 'U16|Z9|CTRL0001',
                transaction_status: 'TRANSACTION_FAILED',
                creation: '2026-10-12 11:42:07.512345',
                transaction_type: 'Redeeming Transaction',
                transaction_method: 'UPI',
                amount_in_paise: '464000',
                balance_after_transaction_in_paise: null,
                payee_name: 'HP Petrol Pump',
                payee_vpa: 'hpcl@okaxis',
                display_payer_name: 'VANTA LOGISTICS',
                upi_rrn: '628912345678',
                note: null,
            })
        ).toEqual({
            id: 'CTRL0001',
            reference: 'U16|Z9|CTRL0001',
            status: 'Failed',
            kind: 'Spend',
            methodLabel: 'UPI',
            createdAt: '2026-10-12T06:12:07.512Z',
            amount: 4640,
            balanceAfter: null,
            counterpartyName: 'HP Petrol Pump',
            counterpartyVpa: 'hpcl@okaxis',
            upiRrn: '628912345678',
            note: '',
        });
    });

    it('names the payer as the counterparty of a load', () => {
        const row = toWalletTransaction({
            name: 'CTRL0002',
            transaction_status: 'TRANSACTION_SUCCESS',
            transaction_type: 'Loading Transaction',
            transaction_method: 'Load via Internet Banking',
            amount_in_paise: '2500000',
            balance_after_transaction_in_paise: '2500000',
            payer_name: 'EXAMPLE TRADERS',
            display_payer_name: 'EXAMPLE TRADERS PRIVATE LIMITED',
        });

        expect(row).toMatchObject({
            kind: 'Load',
            status: 'Completed',
            methodLabel: 'Load via Internet Banking',
            amount: 25000,
            balanceAfter: 25000,
            counterpartyName: 'EXAMPLE TRADERS PRIVATE LIMITED',
        });
    });

    it('reads the remaining daily limits from the balance', () => {
        expect(
            toBalance({
                balance_in_paise: 2500000,
                non_registered_beneficiary_daily_amount_limit: 1000000,
                non_registered_beneficiary_daily_count_limit: 10,
                registered_beneficiary_daily_amount_limit: 5000000,
                registered_beneficiary_daily_count_limit: 20,
            })
        ).toEqual({
            balance: 25000,
            dailyLimits: {
                newPayees: { amountLeft: 10000, countLeft: 10 },
                savedPayees: { amountLeft: 50000, countLeft: 20 },
            },
        });
    });
});
