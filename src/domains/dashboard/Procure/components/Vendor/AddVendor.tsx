import React, { useEffect, useRef } from 'react';

import { Button, Card, Col, Flex, Form, Row, Typography } from 'antd';
import { Formik, setNestedObjectValues, useFormikContext } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import BankingInformation from './BankingInformation';
import BusinessInformation from './BusinessInformation';
import VendorSidebar from './VendorSidebar';
import { usePaymentLinkOnboarding } from '../../hooks/usePaymentLinkOnboarding';
import { useVendor } from '../../hooks/useVendor';
import { addVendorSchema } from '../../schema';
import { resetVendorDraft, setVendorDraft } from '../../slices/vendorDraftSlice';

const { Title, Text } = Typography;

// Auto-saves form values to Redux with 800ms debounce
const AutoSaveDraft: React.FC = () => {
    const { values } = useFormikContext<any>();
    const dispatch = useAppDispatch();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            dispatch(setVendorDraft(values));
        }, 800);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [values, dispatch]);

    return null;
};

const initialValues = {
    businessName: '',
    gstin: '',
    contactPerson: '',
    email: '',
    phone: '',
    tags: [] as string[],
    paymentTerms: '',
    status: 'Active',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    notes: '',
};

const AddVendor: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const returnTo = (location.state as any)?.returnTo as string | undefined;

    const handleCancel = () =>
        navigate(returnTo ?? `${paths.dashboard.procure}/${paths.procure.vendor.index}`);

    const { create, isSubmitting } = useVendor();
    const { record: onboardingRecord, fetchStatus } = usePaymentLinkOnboarding();

    const savedDraft = useAppSelector(state => state.reducer.vendorDraft);
    const formInitialValues = useRef(
        (savedDraft?.businessName || savedDraft?.contactPerson || savedDraft?.email)
            ? { ...initialValues, ...savedDraft }
            : initialValues
    ).current;

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const onSubmit = async (values: typeof initialValues) => {
        const success = await create({ ...values, virtualAccountNumber: onboardingRecord?.virtualAccountNumber });
        if (success) {
            dispatch(resetVendorDraft());
            navigate(returnTo ?? `${paths.dashboard.procure}/${paths.procure.vendor.index}`);
        }
    };

    return (
        <Row gutter={[{ xs: 0, sm: 24 }, 16]} className="p-0">
            <Col xs={24} lg={16}>
                <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 } }}>
                    <Title level={4} className="text-center" style={{ marginBottom: 4 }}>Add Vendor</Title>
                    <Flex justify="center" style={{ marginBottom: 20 }}>
                        <Text className="text-[#000000] text-xs">
                            Register a new vendor in your directory.
                        </Text>
                    </Flex>

                    <Formik
                        initialValues={formInitialValues}
                        validationSchema={addVendorSchema}
                        onSubmit={onSubmit}
                    >
                        {({ handleSubmit, validateForm, setTouched }) => (
                            <Form layout="vertical" onFinish={async () => {
                                const errors = await validateForm();
                                if (Object.keys(errors).length > 0) {
                                    setTouched(setNestedObjectValues(errors, true));
                                    requestAnimationFrame(() => {
                                        const firstError = document.querySelector('.ant-form-item-has-error, [data-form-error="true"]');
                                        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    });
                                    return;
                                }
                                handleSubmit();
                            }}>
                                <AutoSaveDraft />
                                <BusinessInformation />
                                <BankingInformation />

                                <Flex gap={12} wrap="wrap">
                                    <Button type="primary" danger htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                                        Add Vendor
                                    </Button>
                                    <Button
                                        danger
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                        style={{ borderColor: '#ff4f4f', color: '#ff4f4f', background: '#fff' }}
                                    >Cancel</Button>
                                </Flex>
                            </Form>
                        )}
                    </Formik>
                </Card>
            </Col>

            <VendorSidebar />
        </Row>
    );
};

export default AddVendor;
