import * as Yup from 'yup';

export const packageSchema = Yup.object().shape({
    packageName: Yup.string()
        .required('Please enter the package name')
        .min(3, 'Minimum 3 characters required'),
    description: Yup.string().optional().trim().min(3, 'Minimum 3 characters required'),
    packageType: Yup.string().required('Please select the package type'),
    packagePrices: Yup.object().shape({
        monthly: Yup.string().required('Please enter the monthly price'),
        annually: Yup.string().required('Please enter the annual price'),
    }),
    discount: Yup.object().shape({
        monthly: Yup.string(),
        annually: Yup.string(),
    }),
    accessCode: Yup.string().when('packageType', {
        is: 'INDIVIDUAL',
        then: schema => schema.required('Please select the access code'),
        otherwise: schema => schema.optional().nullable(),
    }),
    serviceList: Yup.string()
        .trim()
        .when('packageType', {
            is: 'GROUP',
            then: schema =>
                schema
                    .required('Please enter the service list')
                    .min(3, 'Minimum 3 characters required'),
            otherwise: schema => schema.optional().nullable(),
        }),
    priorityLevel: Yup.number().when('packageType', {
        is: 'GROUP',
        then: schema =>
            schema
                .required('Please enter the priority level')
                .positive('Priority level must be greater than zero'),
        otherwise: schema => schema.optional().nullable(),
    }),
    externalId: Yup.string().optional(),
    notifyCorporates: Yup.boolean().optional(),
});
