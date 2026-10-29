import { useState } from 'react';

import { Button, Form } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { TAB_ID } from '@src/utils/tabId';

import VerificationModal from './VerificationModal';
import usePanGstApi from '../../hooks/usePanGst';
import { panGstValidationSchema } from '../../schema';
import { loginSuccess } from '../../slices/loginSlice';
import { resetRegisterState } from '../../slices/registerSlice';
import { PanGstPayload } from '../../types';

interface RegisterStepFiveProps {
    panOnly?: boolean;
}

const RegisterStepFive = ({ panOnly = false }: RegisterStepFiveProps) => {
    const [documentType, setDocumentType] = useState<'pan' | 'gst'>('pan'); // This ensures that `documentType` is either 'pan' or 'gst'
    const [isOpen, setIsOpen] = useState(false);
    const [resp, setResp] = useState<any>(null); // Store API response
    const [formValues, setFormValues] = useState<any>(null); // Store form values
    const { handlePanGst, isLoading } = usePanGstApi();
    const [verifiedDoc, setVerifiedDoc] = useState<{
        type: 'pan' | 'gst' | null;
        number: string;
        verified: boolean;
    }>({ type: null, number: '', verified: false });
    const dispatch = useAppDispatch();
    const { formData, loginData, signupType } = useAppSelector(state => state.reducer.registration);
    const authChannel = new BroadcastChannel('authChannel');
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
    const handleSubmitForOtp = async (values: any, { setFieldError }: any) => {
        const payload: PanGstPayload = {
            type: documentType,
            value: values.documentName,
            contactPersonName: formData.contactPersonName,
            name: formData.name,
            email: formData.email,
            signupType,
        };

        // Call the handlePanGst function with the new payload
        const response = await handlePanGst(payload);
        if (response.success) {
            if (response.data) {
                if (response.data.status === false && response.data.message) {
                    setFieldError('documentName', response.data.message);
                    return;
                }
                if (response.data.status !== false && response.data?.data) {
                    openModal(response.data.data, values);
                }
            }
        }
    };
    const [documentNumbers, setDocumentNumbers] = useState<{ pan?: string; gst?: string }>({});

    const handleLogin = () => {
        dispatch(loginSuccess({ ...loginData, isAuthenticated: true }));
        authChannel.postMessage({ type: 'login', tabId: TAB_ID });

        dispatch(resetRegisterState());
    };

    const handleVerified = (type: 'pan' | 'gst', number: string) => {
        setVerifiedDoc({ type, number, verified: true });
        setDocumentNumbers(prev => ({
            ...prev,
            [type]: number, // update either 'pan' or 'gst' key
        }));
    };

    const cleanInputString = (input: string) => input.toUpperCase().replace(/[^A-Z0-9]/g, ''); // blocks lowercase and special characters

    return (
        <>
            {!panOnly && (
                <div className="flex w-full max-w-md p-1 my-6 bg-gray-50 rounded-full">
                    <button
                        type="button"
                        onClick={() => setDocumentType('pan')}
                        className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all duration-300 ${documentType === 'pan'
                            ? 'bg-white text-red-500 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        PAN
                    </button>
                    <button
                        type="button"
                        onClick={() => setDocumentType('gst')}
                        className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all duration-300 ${documentType === 'gst'
                            ? 'bg-white text-red-500 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        GST
                    </button>
                </div>
            )}
            <Formik
                key={documentType}
                initialValues={{
                    documentName: documentNumbers[documentType] || '',
                }}
                enableReinitialize
                validationSchema={panGstValidationSchema(documentType)}
                onSubmit={handleSubmitForOtp}
            >
                {({ handleSubmit }) => (
                    <Form
                        onFinish={handleSubmit} // Handle form submission
                        className="w-full max-w-md"
                    >
                        {documentType === 'pan' && (
                            <TextInput
                                name="documentName"
                                type="text"
                                placeholder="Enter PAN (e.g. ABCDE1234F)"
                                classes="rounded-md w-full p-3"
                                maxLength={10}
                                restrictPanGstFormat
                                allowedInputKeys={cleanInputString}
                                isDisabled={
                                    verifiedDoc.type === 'pan' && verifiedDoc.verified
                                }
                            />
                        )}

                        {documentType === 'gst' && (
                            <TextInput
                                name="documentName"
                                type="text"
                                placeholder="Enter GSTIN (e.g. 22AAAAA0000A1Z5)"
                                classes="rounded-md w-full p-3"
                                maxLength={15}
                                restrictPanGstFormat
                                isDisabled={
                                    verifiedDoc.type === 'gst' && verifiedDoc.verified
                                }
                                // values={verifiedDoc.type === 'gst' ? verifiedDoc.number : ''}
                                allowedInputKeys={cleanInputString}
                            />
                        )}

                        <Button
                            loading={isLoading}
                            htmlType="submit"
                            type="primary"
                            danger
                            className="flex items-center justify-center w-full max-w-md p-5 mt-5 text-base text-white"
                        >
                            Submit
                        </Button>
                    </Form>
                )}
            </Formik>
            <VerificationModal
                isOpen={isOpen}
                handleCancel={cancelModal}
                data={resp}
                formValues={formValues}
                handleLogin={handleLogin}
                email={formData.email}
                onVerified={handleVerified}
                signupType={signupType}
            />
        </>
    );
};

export default RegisterStepFive;
