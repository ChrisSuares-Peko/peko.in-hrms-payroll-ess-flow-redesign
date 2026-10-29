import * as Yup from 'yup';

export const incomeDeclarationSchema = Yup.object().shape({
    employee: Yup.string().required('Please select an employee'),
    financialYear: Yup.string().required('Please select a financial year'),

    hraDetails: Yup.object().shape({
        totalRentPaid: Yup.number()
            .typeError('Total Rent Paid must be a number')
            .required('Please enter total rent paid')
            .min(0, 'Rent paid cannot be negative'),
        landlordName: Yup.string()
            .required("Please enter landlord's name")
            .min(3, 'Name must be at least 3 characters')
            .test('no-leading-space', 'Name cannot start with a whitespace', val => !val || !/^\s/.test(val))
            .test('no-trailing-space', 'Name cannot end with a whitespace', val => !val || !/\s$/.test(val))
            .test('no-consecutive-spaces', 'Name cannot contain consecutive whitespaces', val => !val || !/\s{2,}/.test(val)),
        landlordPAN: Yup.string()
            .required("Please enter landlord's PAN")
            .length(10, 'PAN must be 10 characters long')
            .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must be a valid PAN'),
        rentedPropertyAddress: Yup.string()
            .required('Please enter address of rented property')
            .min(3, 'Address must be at least 3 characters')
            .test('no-leading-space', 'Address cannot start with a whitespace', val => !val || !/^\s/.test(val))
            .test('no-trailing-space', 'Address cannot end with a whitespace', val => !val || !/\s$/.test(val))
            .test('no-consecutive-spaces', 'Address cannot contain consecutive whitespaces', val => !val || !/\s{2,}/.test(val)),
        rentReceipts: Yup.string().nullable(),
    }),

    ltaDetails: Yup.object().shape({
        ltaAmountClaimed: Yup.number()
            .typeError('LTA amount must be a number')
            .required('Please enter LTA amount claimed')
            .min(0, 'LTA amount cannot be negative'),
        travelDate: Yup.string().required('Please enter travel date'),
        travelDestination: Yup.string().required('Please enter travel destination'),
        proofOfTravel: Yup.string().nullable(),
    }),

    homeLoanInterestDetails: Yup.object().shape({
        interestPaid: Yup.number()
            .typeError('Interest paid must be a number')
            .required('Please enter interest paid')
            .min(0, 'Interest paid cannot be negative'),
        lenderName: Yup.string()
            .required("Please enter lender's name")
            .min(3, 'Name must be at least 3 characters')
            .test('no-leading-space', 'Name cannot start with a whitespace', val => !val || !/^\s/.test(val))
            .test('no-trailing-space', 'Name cannot end with a whitespace', val => !val || !/\s$/.test(val))
            .test('no-consecutive-spaces', 'Name cannot contain consecutive whitespaces', val => !val || !/\s{2,}/.test(val)),
        lenderPAN: Yup.string()
            .required("Please enter lender's PAN")
            .length(10, 'PAN must be 10 characters long')
            .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must be a valid PAN'),
        lenderAddress: Yup.string()
            .required("Please enter lender's address")
            .min(3, 'Address must be at least 3 characters')
            .test('no-leading-space', 'Address cannot start with a whitespace', val => !val || !/^\s/.test(val))
            .test('no-trailing-space', 'Address cannot end with a whitespace', val => !val || !/\s$/.test(val))
            .test('no-consecutive-spaces', 'Address cannot contain consecutive whitespaces', val => !val || !/\s{2,}/.test(val)),
        proofOfTravel: Yup.string().nullable(),
    }),

    incomeDeclaration: Yup.object().shape({
        annualIncome: Yup.number()
            .typeError('Annual income must be a number')
            .required('Please enter annual income')
            .min(0, 'Annual income cannot be negative'),
        incomeProof: Yup.string().nullable(),
    }),

    chapterVIA: Yup.array().of(
        Yup.object().shape({
            investmentType: Yup.string().required('Please select an investment type'),
            amountInvested: Yup.number()
                .typeError('Amount invested must be a number')
                .required('Please enter amount invested')
                .min(0, 'Amount invested cannot be negative'),
            proof: Yup.string().nullable(),
        })
    ),

    homeLoanDeductions: Yup.array().of(
        Yup.object().shape({
            deductionType: Yup.string().required('Please select deduction type'),
            amountClaimed: Yup.number()
                .typeError('Amount claimed must be a number')
                .required('Please enter amount claimed')
                .min(0, 'Amount claimed cannot be negative'),
            institutionName: Yup.string().required(
                'Please enter name of the institution/organization'
            ),
            certificationDate: Yup.string().required('Please select date of certification'),
            proof: Yup.string().nullable(),
        })
    ),
});
