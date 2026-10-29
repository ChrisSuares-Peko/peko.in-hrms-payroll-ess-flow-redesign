import React from 'react';

import { Flex, Form, Spin, Typography } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import BankingInformation from './BankingInformation';
import BusinessInformation from './BusinessInformation';
import { useVendor } from '../../hooks/useVendor';
import { addVendorSchema } from '../../schema';

const { Text } = Typography;

const drawerTitle = (
    <Flex vertical gap={2}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>Edit Vendor</span>
        <Text style={{ fontSize: 13, fontWeight: 400, color: '#475569' }}>Update vendor details in your directory</Text>
    </Flex>
);

interface Props {
    vendorId: string | undefined;
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditVendorDrawer: React.FC<Props> = ({ vendorId, open, onClose, onSuccess }) => {
    const { detail, isLoading, update, isSubmitting } = useVendor(vendorId);

    const initialValues = {
        businessName:  detail?.businessName ?? '',
        gstin:         detail?.gstin ?? '',
        contactPerson: detail?.contactPerson ?? '',
        email:         detail?.email ?? '',
        phone:         detail?.phone ?? '',
        tags:          (detail?.tags ?? []) as string[],
        paymentTerms:  detail?.paymentTerms ?? '',
        status:        detail?.status ?? 'Active',
        bankName:      detail?.bankName ?? '',
        accountNumber: detail?.accountNumber ?? '',
        ifscCode:      detail?.ifscCode ?? '',
    };

    return (
        <CustomModalWithForm
            modalTitle={drawerTitle}
            open={open}
            handleCancel={onClose}
            initialValues={initialValues}
            validationSchema={addVendorSchema}
            firstBtnTxt="Edit Vendor"
            isLoading={isSubmitting}
            isDisabled={isSubmitting || isLoading}

            reinitialise
            handleFormSubmit={async (values) => {
                if (!vendorId) return;
                const success = await update(vendorId, values);
                if (success) {
                    onSuccess?.();
                    onClose();
                }
            }}
        >
            {isLoading || !detail ? (
                <Flex justify="center" align="center" style={{ minHeight: 300 }}>
                    <Spin size="large" />
                </Flex>
            ) : (
                <Form layout="vertical">
                    <BusinessInformation />
                    <BankingInformation />
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default EditVendorDrawer;
