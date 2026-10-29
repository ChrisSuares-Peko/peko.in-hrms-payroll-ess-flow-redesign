import * as Yup from 'yup';

const spaceValidation = (fieldName: string) => function checkValidation (this: Yup.TestContext, value: string | undefined) {
        if (!value) return false;

        if (value.startsWith(' ')) {
            return this.createError({
                message: `${fieldName} cannot start with a whitespace`,
            });
        }

        if (value.endsWith(' ')) {
            return this.createError({
                message: `${fieldName} cannot end with a whitespace`,
            });
        }

        if (/ {2,}/.test(value)) {
            return this.createError({
                message: `${fieldName} cannot contain consecutive whitespaces`,
            });
        }

        return true;
    };

export const updateEmployeeSchema = Yup.object({
    accountName: Yup.string()
        .required('Please enter the account holder name')
        .test('space-validation', 'Invalid account holder name', spaceValidation('Account holder name'))
        .min(3, 'Account holder name must be at least 3 characters')
        .max(100, 'Account holder name must be at most 100 characters'),
    accountNumber: Yup.string()
        .required('Please enter the account number')
        .matches(/^\d+$/, 'Account number must contain only digits')
        .min(9, 'Account number must be at least 9 digits')
        .max(18, 'Account number must be at most 18 digits'),
    bankName: Yup.string()
        .required('Please enter the bank name')
        .test('space-validation', 'Invalid bank name', spaceValidation('Bank name'))
        .min(3, 'Bank name must be at least 3 characters')
        .max(100, 'Bank name must be at most 100 characters'),
    transactionType: Yup.string().required('Please select the transaction type'),
    ifscCode: Yup.string()
        .required('Please enter the IFSC code')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC Code')
        .length(11, 'IFSC code must be exactly 11 characters'),
    remark: Yup.string()
        .transform(v => (v === '' ? undefined : v))
        .optional()
        .min(3, 'Remark must be at least 3 characters')
        .matches(/^[a-zA-Z ]*$/, 'Remark must contain only letters and spaces')
        .max(50, 'Remark must be at most 50 characters')
        .test('space-validation', 'Invalid remark', function checkRemarkValidation(value) {
            if (!value) return true;
            return spaceValidation('Remark').call(this, value);
        }),
       
});
