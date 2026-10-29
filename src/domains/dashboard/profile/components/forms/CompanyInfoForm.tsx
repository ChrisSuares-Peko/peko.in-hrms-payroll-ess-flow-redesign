import { useEffect, useState } from 'react';

import { Flex, Form } from 'antd';
import { FormikProps, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import VerifycinNo from '../../hooks/useVerifyCinApi';
import VerifygstNo from '../../hooks/useVerifyGstApi';
import VerifypanNo from '../../hooks/useVerifyPanApi';
import CustomFileUpload from '../CustomFileUpload';
import VerificationModal from '../VerificationModal';
import VerifyTextInput from '../VerifyTextInput';

interface CompanyInfoFormProps {
    activities: any[];
    open?: boolean;
}

const CompanyInfoForm = ({ activities, open }: CompanyInfoFormProps) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [file, setFile] = useState<any>('');
    const [isOpen, setIsOpen] = useState(false);
    const [resp, setResp] = useState<any>(null); // Store API response
    const [formValues, setFormValues] = useState<any>(null); // Store form values
    const [unlockedFields, setUnlockedFields] = useState({
        cin: false,
        gst: false,
        pan: false,
    });
    const openModal = (response: any, values: any) => {
        setResp(response);
        setFormValues(values);
        setIsOpen(true);
    };

    const cancelModal = () => {
        setIsOpen(false);
        setResp(null);
        setFormValues(null);
    };

    const dispatch = useAppDispatch();
    const { data } = useAppSelector(state => state.reducer.companyInfo);

    // Re-lock fields once the persisted company info changes (e.g. after a successful update).
    useEffect(() => {
        setUnlockedFields({ cin: false, gst: false, pan: false });
    }, [data]);

    // Re-lock fields once the drawer is closed, so re-opening it starts from the saved state again.
    useEffect(() => {
        if (!open) {
            setUnlockedFields({ cin: false, gst: false, pan: false });
        }
    }, [open]);
    const validateGstNumber = (gstNumber: string) => {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!gstNumber) {
            dispatch(
                showToast({
                    description: 'Please enter your GST number',
                    variant: 'error',
                })
            );
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
            dispatch(
                showToast({
                    description: 'Invalid GSTIN format',
                    variant: 'error',
                })
            );
            return false;
        }

        return true;
    };
    const validatePanNumber = (panNumber: string) => {
        const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;

        if (!panNumber) {
            dispatch(
                showToast({
                    description: 'Please enter your PAN',
                    variant: 'error',
                })
            );
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
            dispatch(
                showToast({
                    description: 'Invalid PAN format',
                    variant: 'error',
                })
            );
            return false;
        }

        return true;
    };
    const validateCinNumber = (cinNumber: string) => {
        const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

        if (!cinNumber) {
            dispatch(
                showToast({
                    description: 'Please enter your CIN',
                    variant: 'error',
                })
            );
            return false;
        }
        if (cinNumber.length !== 21) {
            dispatch(
                showToast({
                    description: 'CIN must be exactly 21 characters',
                    variant: 'error',
                })
            );
            return false;
        }
        if (!cinRegex.test(cinNumber)) {
            dispatch(
                showToast({
                    description: 'Invalid CIN format',
                    variant: 'error',
                })
            );
            return false;
        }
        return true;
    };
    const { verifyGstDetails, isLoader } = VerifygstNo();
    const { verifyPanDetails, isLoading } = VerifypanNo();
    const { verifyCINDetails, Loading } = VerifycinNo();
    const { values, setFieldValue, validateField, errors }: FormikProps<any> =
        useFormikContext() ?? {};
    const handleVerifyGSTNumber = async () => {
        if (errors.gstNumber && errors.gstNumber !== 'GST number must be verified') {
            return;
        }
        if (validateGstNumber(values.gstNumber)) {
            const response = await verifyGstDetails(values.gstNumber);
            if (response?.success !== false) {
                openModal(response, values);
            }
        }
    };

    const handleVerifyPanNumber = async () => {
        if (errors.panNumber && errors.panNumber !== 'PAN must be verified') {
            return;
        }
        if (validatePanNumber(values.panNumber)) {
            const response = await verifyPanDetails(values.panNumber);
            if (response?.success !== false) {
                openModal(response, values);
            }
        }
    };

    const handleVerifyCINNumber = async () => {
        if (errors.cinNumber && errors.cinNumber !== 'CIN must be verified') {
            return;
        }
        if (validateCinNumber(values.cinNumber)) {
            const response = await verifyCINDetails(values.cinNumber);
            if (response?.success !== false) {
                openModal(response, values);
            }
        }
    };
    return (
        <>
            <Flex vertical className="w-full mt-2">
                <Form layout="vertical">
                    <TextInput
                        type="text"
                        name="activity"
                        label="Activity"
                        placeholder="Enter Activity"
                        classes=" rounded-sm "
                    />
                    <VerifyTextInput
                        name="cinNumber"
                        label="Corporate Identification Number"
                        type="text"
                        placeholder="Enter Corporate Identification Number"
                        classes="rounded-sm"
                        verifyText="cinVerified"
                        onVerify={handleVerifyCINNumber}
                        isVerified={unlockedFields.cin ? false : data?.cinVerified}
                        isDisabled={!!data?.cinNumber && !unlockedFields.cin}
                        onEdit={() => setUnlockedFields(prev => ({ ...prev, cin: true }))}
                        maxLength={21}
                        convertToUppercase
                        allowAlphabetsAndNumbersOnly
                        handleChange={value => {
                            if (value) {
                                const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '');

                                setFieldValue('cinNumber', sanitizedValue);
                                setTimeout(() => {
                                    validateField('cinNumber');
                                }, 0);
                            } else {
                                setFieldValue('cinNumber', '');
                            }
                        }}
                        loading={Loading}
                    />

                    <VerifyTextInput
                        name="gstNumber"
                        label="GSTIN"
                        type="text"
                        placeholder="Enter GSTIN"
                        classes=" rounded-sm"
                        maxLength={15}
                        onVerify={handleVerifyGSTNumber}
                        verifyText="gstVerified"
                        isVerified={unlockedFields.gst ? false : data?.gstVerified}
                        isDisabled={!!data?.gstNumber && !unlockedFields.gst}
                        onEdit={() => setUnlockedFields(prev => ({ ...prev, gst: true }))}
                        convertToUppercase
                        handleChange={value => {
                            if (value) {
                                const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '');

                                setFieldValue('gstNumber', sanitizedValue);
                                setTimeout(() => {
                                    validateField('gstNumber');
                                }, 0);
                            } else {
                                setFieldValue('gstNumber', '');
                            }
                        }}
                        loading={isLoader}
                    />
                    <VerifyTextInput
                        name="panNumber"
                        label="PAN"
                        type="text"
                        placeholder="Enter PAN"
                        classes=" rounded-sm"
                        maxLength={10}
                        onVerify={handleVerifyPanNumber}
                        verifyText="panVerified"
                        isVerified={unlockedFields.pan ? false : data?.panVerified}
                        isDisabled={!!data?.panNumber && !unlockedFields.pan}
                        onEdit={() => setUnlockedFields(prev => ({ ...prev, pan: true }))}
                        convertToUppercase
                        handleChange={value => {
                            if (value) {
                                const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, ''); // Allow only letters & numbers

                                setFieldValue('panNumber', sanitizedValue);

                                setTimeout(() => {
                                    validateField('panNumber');
                                }, 0);
                            } else {
                                setFieldValue('panNumber', '');
                            }
                        }}
                        loading={isLoading}
                    />
                    <CustomFileUpload
                        label="Upload Corporate Identification Number Certificate"
                        subLabel="(Formats Supported: JPEG, PNG, PDF. Max size: 5 MB)"
                        name="cinDoc"
                        setFile={setFile}
                        format="cinFormat"
                        maxFileSize={5120}
                        showFileName
                        defaultFileName="CIN Certificate"
                        allowedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
                    />
                    <CustomFileUpload
                        label="Upload GSTIN Certificate"
                        subLabel="(Formats Supported: JPEG, PNG, PDF. Max size: 5 MB)"
                        name="gstDoc"
                        setFile={setFile}
                        format="gstFormat"
                        maxFileSize={5120}
                        showFileName
                        defaultFileName="GSTIN Certificate"
                        allowedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
                    />
                    <CustomFileUpload
                        label="Upload PAN Card "
                        subLabel="(Formats Supported: JPEG, PNG, PDF. Max size: 5 MB)"
                        name="panDoc"
                        setFile={setFile}
                        maxFileSize={5120}
                        format="panFormat"
                        showFileName
                        defaultFileName="PAN Card"
                        allowedFileTypes={['image/png', 'image/jpeg', 'application/pdf']}
                    />
                </Form>
            </Flex>
            <VerificationModal
                isOpen={isOpen}
                handleCancel={cancelModal}
                data={resp}
                formValues={formValues}
            />
        </>
    );
};

export default CompanyInfoForm;
