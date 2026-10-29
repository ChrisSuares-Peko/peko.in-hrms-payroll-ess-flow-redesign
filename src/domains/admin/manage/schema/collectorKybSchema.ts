import * as Yup from 'yup';

export const collectorKybSchema = Yup.object().shape({
    kybStatus: Yup.string().required('Please select status'),
    rejectReason: Yup.string()
        .transform(value => value.trim())
        .optional() // Makes it optional
        .min(3, 'Reason must be at least 3 characters')
        .max(255, 'Reason cannot exceed 255 characters')
        .test(
            'not-only-whitespace',
            'Reason cannot be only whitespace',
            value => !value || !/^\s*$/.test(value)
        ),
});
