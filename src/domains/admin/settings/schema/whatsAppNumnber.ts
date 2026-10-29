import * as Yup from 'yup';

const whatsappNumberShema = Yup.object().shape({
    whatsappNumber: Yup.string()
        .matches(/^[1-9][0-9]*$/, 'Please enter a mobile number that does not start with zero')
        .required('Please enter the Whatsapp number')
        .min(9, 'Mobile number must 9 digits'),

    name: Yup.string()
        .required('Please enter the name')
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Name cannot be longer than 50 characters')
        .test(
            'no-leading-whitespace',
            'Name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),
});

export default whatsappNumberShema;
