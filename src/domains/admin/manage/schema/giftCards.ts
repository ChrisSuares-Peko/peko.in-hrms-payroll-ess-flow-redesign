import * as Yup from 'yup';

import { withCommissionLimitTest } from '../../utils/commissionValidation';
import { priceTypes, usageTypes } from '../utils/giftCards';

export const giftCardSchema = Yup.object().shape({
    product_name: Yup.string().trim().required('Product Name is required'),
    product_id: Yup.string().required('Product ID is required'),
    priceType: Yup.string()
        .oneOf([...priceTypes.map(({ oValue }) => oValue), ''], 'Invalid Price type')
        .optional(),
    usageType: Yup.string()
        .oneOf(
            usageTypes.map(({ oValue }) => oValue),
            'Invalid Usage type'
        )
        .required('Usage type is required'),
    min_price: Yup.number().when('priceType', {
        is: 'FLEXI',
        then: schema =>
            schema
                .required('Minimum Price is required for flexi denomination')
                .min(1, 'Minimum Price must be greater than or equal to 1'),
        otherwise: schema => schema.optional(),
    }),
    max_price: Yup.number().when('priceType', {
        is: 'FLEXI',
        then: schema =>
            schema
                .required('Maximum Price is required for flexi denomination')
                .min(Yup.ref('min_price'), 'Maximum Price must be greater than Minimum Price'),
        otherwise: schema => schema.optional(),
    }),
    // mrp: Yup.number().when('is_open_denominnation', {
    //     is: false,
    //     then: schema => schema.required('MRP is required for fixed denomination'),
    //     otherwise: schema => schema.optional(),
    // }),
    // selling_price: Yup.number().when('is_open_denominnation', {
    //     is: false,
    //     then: schema => schema.required('Selling Price is required for fixed denomination'),
    //     otherwise: schema => schema.optional(),
    // }),
    denominations: Yup.array()
        .of(Yup.number())
        .when('priceType', {
            is: 'FIXED',
            then: schema =>
                schema
                    .min(1, 'At least one denomination is required for fixed denomination')
                    .required('Denominations are required for fixed denomination'),
            otherwise: schema => schema.optional(),
        }),
    commissionMode: Yup.string()
        .oneOf(['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'], 'Invalid Commission Mode')
        .required('Commission Mode is required'),
    commissionType: Yup.string().oneOf(['PERCENTAGE', 'FLAT']).optional(),
    commission: withCommissionLimitTest(Yup.number().min(0).optional(), (root: any) => {
        if (root?.priceType === 'FLEXI') return [root?.min_price];
        if (root?.priceType === 'FIXED') return Array.isArray(root?.denominations) ? root.denominations : [];
        return [];
    }),
    fixedCommissionPerTransaction: Yup.number().min(0).optional(),
    isCommissionInclGST: Yup.boolean().optional(),
});
