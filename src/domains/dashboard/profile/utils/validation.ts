import { showToast } from '@src/slices/apiSlice';

export const validateGstNumber = (gstNumber: any, dispatch: any) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstNumber) {
        dispatch(showToast({ description: 'Please enter your GST number', variant: 'error' }));
        return false;
    }
    if (gstNumber.length !== 15) {
        dispatch(
            showToast({
                description: 'GST number must be exactly 15 characters',
                variant: 'error',
            })
        );
        return false;
    }
    if (!gstRegex.test(gstNumber)) {
        dispatch(showToast({ description: 'Invalid GSTIN format', variant: 'error' }));
        return false;
    }
    return true;
};

export const validatePanNumber = (panNumber: any, dispatch: any) => {
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    if (!panNumber) {
        dispatch(showToast({ description: 'Please enter your PAN', variant: 'error' }));
        return false;
    }
    if (panNumber.length !== 10) {
        dispatch(
            showToast({
                description: 'PAN must be exactly 10 characters',
                variant: 'error',
            })
        );
        return false;
    }
    if (!panRegex.test(panNumber)) {
        dispatch(showToast({ description: 'Invalid PAN format', variant: 'error' }));
        return false;
    }
    return true;
};
