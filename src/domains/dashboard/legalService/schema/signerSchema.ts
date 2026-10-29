import * as Yup from 'yup';

const emailRegex = /^(?!\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/;

export const signerSchema = (otherEmails: string[]) =>
    Yup.object().shape({
        name: Yup.string()
            .required('Please enter recipient name')
            .min(3, 'Name must be at least 3 characters'),
        email: Yup.string()
            .required('Please enter the email ID')
            .matches(emailRegex, 'Please enter a valid email ID')
            .test('unique-email', 'Signer email must be unique', value => {
                if (!value) return true;
                return !otherEmails.some(e => e.toLowerCase() === value.toLowerCase());
            }),
        phone: Yup.string().trim(),
    });
