import * as Yup from 'yup';

import {
    textField,
    withGstinValidation,
    withLetterRequired,
    withSpaceValidation,
} from '../utils/yupHelpers';

export const eWaybillSchema = Yup.object({
    transportMode: Yup.string().required('Please select the transport mode'),
    distance: Yup.number()
        .typeError('Distance must be a number')
        .required('Please enter the distance')
        .min(1, 'Distance must be at least 1 km')
        .max(4000, 'Distance cannot exceed 4000 km'),
    transporterGstin: withGstinValidation(Yup.string().optional()),
    transporterName: withLetterRequired(
        withSpaceValidation(Yup.string().optional(), 'Transporter name'),
        'Transporter name'
    )
        .min(3, 'Transporter name must be at least 3 characters')
        .max(100, 'Transporter name must be at most 100 characters'),
    vehicleNumber: Yup.string().when('transportMode', {
        is: 'road',
        then: () =>
            textField('Vehicle number', 'Please enter the vehicle number').matches(
                /^(?:[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{0,3}[\s-]?\d{1,4}|(?:\d{2}BH\d{4}[A-Z]{1,2}))$/i,
                'Please enter a valid Indian vehicle number'
            ),
        otherwise: schema => schema.optional(),
    }),
    vehicleType: Yup.string().when('transportMode', {
        is: 'road',
        then: schema => schema.oneOf(['regular', 'odc']).required('Please select the vehicle type'),
        otherwise: schema => schema.optional(),
    }),
    transDocNo: Yup.string().when('transportMode', {
        is: (mode: string) => mode !== 'road',
        then: () =>
            Yup.string()
                .required('Please enter the transport document number')
                .matches(/^[0-9A-Z-]{1,15}$/, 'Only alphabets and numbers are allowed'),
        otherwise: schema => schema.optional(),
    }),
    transDocDt: Yup.string().when('transportMode', {
        is: (mode: string) => mode !== 'road',
        then: schema => schema.required('Please select the transport document date'),
        otherwise: schema => schema.optional(),
    }),
});
