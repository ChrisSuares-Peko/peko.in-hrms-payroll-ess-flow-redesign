import * as Yup from 'yup';

const MAX_BALANCE = 99999999.9999;

export const selfTransferSchema = (currentBalance: string) =>
    Yup.object().shape({
        type: Yup.string().required('Please select the transfer type'),
        amount: Yup.string()
            .required('Please enter the amount')
            .test('is-greater-than-zero', 'Amount must be greater than zero', value => {
                const numberValue = Number(value);
                return !Number.isNaN(numberValue) && numberValue > 0;
            })
            .test(
                'sufficient-balance',
                'Insufficient balance. Please enter a smaller amount.',
                function validateSufficientBalance(value) {
                    const { type } = this.parent; // Context to access sibling fields
                    if (type === 'Debit') {
                        // Check if the amount is less than or equal to the current balance
                        return Number(value) <= Number(currentBalance);
                    }
                    // No validation required for other types
                    return true;
                }
            )
            .test(
                'max-balance',
                `Invalid amount. Please enter a smaller amount.`,
                function validateMaxBalance(value) {
                    // Ensure total balance doesn't exceed MAX_BALANCE
                    const { type } = this.parent; // Access sibling fields
                    if (type === 'Credit') {
                        return Number(currentBalance) + Number(value) <= MAX_BALANCE;
                    }
                    return Number(value) <= MAX_BALANCE;
                }
            ),
        password: Yup.string().required('Please enter the passsword'),
    });
