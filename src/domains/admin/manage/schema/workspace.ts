import * as Yup from 'yup';

export const workspaceSchema = Yup.object().shape({
    name: Yup.string()
        .min(3, 'Workspace name must be at least 3 characters')
        .required('Please enter workspace  name'),
    address: Yup.string()
        .min(3, 'Workspace address must be at least 3 characters')
        .required('Please enter workspace  address'),
    yearlyPrice: Yup.string()
        .required('Please enter yearly price')
        .test('is-greater-than-zero', 'Price must be greater than zero', value => {
            const numberValue = Number(value);
            return !Number.isNaN(numberValue) && numberValue > 0;
        }),
    monthlyPrice: Yup.string()
        .required('Please enter monthly price')
        .test('is-greater-than-zero', 'Price must be greater than zero', value => {
            const numberValue = Number(value);
            return !Number.isNaN(numberValue) && numberValue > 0;
        }),
    latLng: Yup.string().required('Please enter lattitude/ longitude'),
    planId: Yup.string().required('Please select a plan'),
});
