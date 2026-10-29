import * as Yup from 'yup';

const noConsecutiveWhitespaces = (message: string) =>
    Yup.string().test('no-consecutive-whitespaces', message, value => {
        if (typeof value !== 'string') return true;
        return !/\s{2,}/.test(value);
    });

const emailWorkspaceSchema = Yup.object().shape({
    peko_key: Yup.string()
        .concat(noConsecutiveWhitespaces('Peko key must not contain consecutive whitespaces'))
        .required('Please enter the peko key')
        .min(3, 'Peko key must be at least 3 characters'),
    name: Yup.string()
        .concat(noConsecutiveWhitespaces('Name must not contain consecutive whitespaces'))
        .required('Please enter the business email name')
        .min(3, 'Name must be at least 3 characters'),
    type: Yup.string()
        .required('Please select the type')
        .oneOf(['EMAIL', 'DOMAIN'], 'Type must be either Email or Domain'),
    offersText: Yup.string()
        .concat(noConsecutiveWhitespaces('Offers must not contain consecutive whitespaces'))
        .optional(),
    pekoEmail: Yup.string()
        .concat(
            noConsecutiveWhitespaces('Email addresses must not contain consecutive whitespaces')
        )
        .required('Please enter at least one email ID')
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:,[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/,
            'Please enter a valid email ID'
        ),
    vendorId: Yup.string().required('Please select a vendor'),
});

export default emailWorkspaceSchema;
