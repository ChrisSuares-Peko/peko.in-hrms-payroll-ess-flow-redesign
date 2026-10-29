import * as Yup from 'yup';

const textField = (label: string, required: boolean, max?: number) => {
    let schema = Yup.string()
        .test(
            'no-leading-space',
            `${label} cannot start with a whitespace`,
            v => !v || !v.startsWith(' ')
        )
        .test(
            'no-trailing-space',
            `${label} cannot end with a whitespace`,
            v => !v || !v.endsWith(' ')
        )
        .test(
            'no-consecutive-spaces',
            `${label} cannot contain consecutive whitespaces`,
            v => !v || !/ {2,}/.test(v)
        )
        .min(3, `${label} must be at least 3 characters`);
    if (max) schema = schema.max(max);
    return required ? schema.required(`${label} is required`) : schema.optional();
};

export const legalTemplatesSchema = Yup.object().shape({
    title: textField('Template title', true, 150),
    category: Yup.string().required('Category is required'),
    description: textField('Description', true, 300),
    timeEstimate: Yup.string()
        .required('Time estimate is required')
        .test(
            'no-leading-space',
            'Time estimate cannot start with a whitespace',
            v => !v || !v.startsWith(' ')
        )
        .test(
            'no-trailing-space',
            'Time estimate cannot end with a whitespace',
            v => !v || !v.endsWith(' ')
        )
        .matches(
            /^\d+\s*-\s*\d+\s*min$/i,
            'Time estimate must be in format: number - number min (e.g. 5-8 min)'
        ),
    iconKey: Yup.string().required('Icon is required'),
    documentFile: Yup.string().when('id', {
        is: (id: any) => !id,
        then: schema => schema.required('Please upload a DOCX template file'),
        otherwise: schema => schema.optional(),
    }),
});
