import * as yup from 'yup';

/**
 * Creates a Yup validation schema for the settlement request form.
 * Accepts the current available balance so the amount cap is enforced
 * both on blur and on submit without an extra API call.
 */
export const createSettlementRequestSchema = (availableBalance: number | null) =>
    yup.object({
        amount: yup
            .number()
            .typeError('Please enter a valid amount')
            .required('Amount is required')
            .positive('Amount must be greater than ₹0')
            .min(1, 'Minimum settlement amount is ₹1')
            .test(
                'not-exceed-balance',
                availableBalance != null
                    ? `Amount cannot exceed your available balance of ₹${Number(availableBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'Amount exceeds available balance',
                value => availableBalance == null || value == null || value <= availableBalance
            ),
        remarks: yup
            .string()
            .max(250, 'Remarks cannot exceed 250 characters')
            .optional(),
    });

export type SettlementRequestFormValues = yup.InferType<
    ReturnType<typeof createSettlementRequestSchema>
>;
