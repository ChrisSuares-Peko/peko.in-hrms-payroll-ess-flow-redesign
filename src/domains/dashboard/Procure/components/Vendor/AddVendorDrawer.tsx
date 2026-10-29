import React, { useEffect, useRef } from 'react';

import { Flex, Form, Typography } from 'antd';
import { useFormikContext } from 'formik';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import BankingInformation from './BankingInformation';
import BusinessInformation from './BusinessInformation';
import { usePaymentLinkOnboarding } from '../../hooks/usePaymentLinkOnboarding';
import { useVendor } from '../../hooks/useVendor';
import { addVendorSchema } from '../../schema';
import { resetVendorDraft, setVendorDraft } from '../../slices/vendorDraftSlice';

const { Text } = Typography;

const drawerTitle = (
    <Flex vertical gap={2}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>Add New Vendor</span>
        <Text style={{ fontSize: 13, fontWeight: 400, color: '#475569' }}>Register a new vendor in your directory</Text>
    </Flex>
);

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

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const AddVendorDrawer: React.FC<Props> = ({ open, onClose, onSuccess }) => {
    const dispatch = useAppDispatch();
    const { create, isSubmitting } = useVendor();
    const { record: onboardingRecord, fetchStatus } = usePaymentLinkOnboarding();

    const savedDraft = useAppSelector(state => state.reducer.vendorDraft);
    const formInitialValues = useRef(
        (savedDraft?.businessName || savedDraft?.contactPerson || savedDraft?.email)
            ? { ...initialValues, ...savedDraft }
            : initialValues
    ).current;

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    return (
        <CustomModalWithForm
            modalTitle={drawerTitle}
            open={open}
            handleCancel={onClose}
            initialValues={formInitialValues}
            validationSchema={addVendorSchema}
            firstBtnTxt="Add Vendor"
            isLoading={isSubmitting}
            isDisabled={isSubmitting}

            handleFormSubmit={async (values, { resetForm }) => {
                const success = await create({ ...values, virtualAccountNumber: onboardingRecord?.virtualAccountNumber });
                if (success) {
                    dispatch(resetVendorDraft());
                    resetForm();
                    onSuccess?.();
                    onClose();
                }
            }}
        >
            <Form layout="vertical">
                <AutoSaveDraft />
                <BusinessInformation />
                <BankingInformation />
            </Form>
        </CustomModalWithForm>
    );
};

export default AddVendorDrawer;
