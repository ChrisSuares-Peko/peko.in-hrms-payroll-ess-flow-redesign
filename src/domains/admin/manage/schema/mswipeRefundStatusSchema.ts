import * as Yup from 'yup';

export const mswipeRefundStatusSchema = Yup.object().shape({
    status: Yup.string().required('Please select the refund status'),
    refundReference: Yup.string()
        .max(128, 'Refund reference cannot exceed 128 characters')
        .test(
            'no-leading-whitespace',
            'Refund reference cannot start with whitespace',
            value => !value || !/^\s/.test(value)
        )
        .matches(
            /^[A-Za-z0-9 ._/-]*$/,
            'Refund reference can only contain letters, numbers, spaces and . _ / -'
        )
        .when('status', {
            is: 'SUCCESS',
            then: schema => schema.required('Please enter the Mswipe refund reference'),
        }),
    remarks: Yup.string()
        .max(500, 'Remarks cannot exceed 500 characters')
        .test(
            'no-leading-whitespace',
            'Remarks cannot start with whitespace',
            value => !value || !/^\s/.test(value)
        )
        .when('status', {
            is: 'FAILED',
            then: schema => schema.required('Please enter the reason for rejecting the refund'),
        }),
});
