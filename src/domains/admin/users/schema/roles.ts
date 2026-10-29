import * as Yup from 'yup';

const noConsecutiveWhitespaces = (message: string) =>
    Yup.string().test('no-consecutive-whitespaces', message, value => {
        if (typeof value !== 'string') return true;
        return !/\s{2,}/.test(value);
    });
const rolesSchema = Yup.object().shape({
    roleName: Yup.string()
        .concat(noConsecutiveWhitespaces('Role name must not contain consecutive whitespaces'))
        .required('Role name is required')
        .min(3, 'Role name must be at least 3 characters'),
});

export default rolesSchema;
