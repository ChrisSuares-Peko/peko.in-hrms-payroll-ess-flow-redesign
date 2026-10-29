import * as Yup from 'yup';

export const schema = Yup.object().shape({
    email: Yup.string()
        .email('Please enter a valid email ID')
        .required(' Please enter the email ID ')
        .test(
            'is-valid-email',
            'Please enter a valid email ID',
            value => !/^\.|^.+@\.|^.*\.@.*\..*|^.*\.$/.test(value)
        ),
});
