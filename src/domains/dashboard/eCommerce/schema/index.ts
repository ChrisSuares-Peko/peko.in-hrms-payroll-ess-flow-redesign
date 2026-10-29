import * as Yup from 'yup';

const noConsecutiveWhitespaces = (message: string) =>
    Yup.string().test('no-consecutive-whitespaces', message, value => {
        if (typeof value !== 'string') return true;
        return !/\s{2,}/.test(value);
    });

const doesNotStartWithSpace = (value?: string) =>
    typeof value === 'string' && value.length > 0 ? value[0] !== ' ' : true;

const doesNotEndWithSpace = (value?: string) =>
    typeof value === 'string' && value.length > 0 ? value[value.length - 1] !== ' ' : true;

export const STORE_NAME_MIN = 3;
export const STORE_NAME_MAX = 48;

export const storeNameSchema = Yup.object().shape({
    storeName: Yup.string()
        .required('Please enter a store name')
        .min(STORE_NAME_MIN, `Store name must be at least ${STORE_NAME_MIN} characters`)
        .max(STORE_NAME_MAX, `Store name cannot exceed ${STORE_NAME_MAX} characters`)
        .matches(
            /^[A-Za-z0-9 &\-'.,]+$/,
            "Store name can only contain letters, numbers, spaces and & - ' . ,"
        )
        .test('no-leading-space', 'Store name cannot start with a space', doesNotStartWithSpace)
        .test('no-trailing-space', 'Store name cannot end with a space', doesNotEndWithSpace)
        .concat(noConsecutiveWhitespaces('Store name cannot contain consecutive spaces')),
});

export const validateStoreName = (storeName: string): string | null => {
    try {
        storeNameSchema.validateSync({ storeName });
        return null;
    } catch (err) {
        const e = err as { errors?: string[]; message?: string };
        return e.errors?.[0] ?? e.message ?? 'Invalid store name';
    }
};
