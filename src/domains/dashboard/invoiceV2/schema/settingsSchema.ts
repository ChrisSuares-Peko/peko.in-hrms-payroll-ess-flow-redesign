import * as Yup from 'yup';


export const settingsSchema = Yup.object().shape({
    autoUpdateDocNumber: Yup.boolean(),
    autoAddItemsToCatalog: Yup.boolean(),
    gstPercent: Yup.string(),
    currency: Yup.string(),
    paymentMode: Yup.string(),
    defaultDueDays: Yup.number()
        .min(1, 'Default due days must be at least 1')
        .max(365, 'Default due days cannot exceed 365')
        .integer('Default due days must be a whole number'),
    documentPrefixes: Yup.object().test(
        'valid-prefixes',
        'Prefixes must be strings',
        val => !val || Object.values(val).every(v => typeof v === 'string')
    ),
    termsAndConditions: Yup.string().trim(),
    notes: Yup.string().trim(),
});
