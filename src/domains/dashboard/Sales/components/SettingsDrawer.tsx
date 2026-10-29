import React, { useEffect } from 'react';

import { Button, Drawer, Flex, Spin } from 'antd';
import { Formik } from 'formik';

import LeftHeader from './shared/LeftHeader';
import SettingsForm from '../forms/SettingsForm';
import { useFormAutoFocus } from '../hooks/useFormAutoFocus';
import useSettings from '../hooks/useSettings';
import { settingsSchema } from '../schema/settingsSchema';
import { SettingsFormValues } from '../types/settings';
import { splitSettingsValues } from '../utils/settingsUtils';

interface SettingsDrawerProps {
    open: boolean;
    onClose: () => void;
}

const INITIAL_VALUES: SettingsFormValues = {
    businessName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstNo: '',
    autoUpdateDocNumber: true,
    autoAddItemsToCatalog: false,
    gstPercent: '5',
    currency: 'INR',
    paymentMode: undefined,
    defaultDueDays: 14,
    selectedDocumentType: undefined,
    documentPrefixes: { Invoice: 'INV', Quotation: 'QO', 'Sales Order': 'SO', Agreement: 'AGR' },
    termsAndConditions: '',
    notes: '',
    signature: null,
    removeSignature: false,
};

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
    const { settings, saveSettings, isLoading, fetchSettings } = useSettings({ autoFetch: false });
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({
        schema: settingsSchema,
    });

    useEffect(() => {
        if (open) fetchSettings();
    }, [open, fetchSettings]);

    return (
        <Formik
            initialValues={settings ?? INITIAL_VALUES}
            validationSchema={settingsSchema}
            enableReinitialize
            onSubmit={async (values, { resetForm }) => {
                await saveSettings(splitSettingsValues(values));
                resetForm();
                onClose();
            }}
        >
            {({ handleSubmit, resetForm, setFieldTouched, values }) => {
                const handleClose = () => {
                    resetForm();
                    onClose();
                };

                const handleSave = () => {
                    handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, values);
                };

                const drawerFooter = (
                    <Flex justify="flex-end" gap={10}>
                        <Button onClick={handleClose} className="px-5">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            danger
                            onClick={handleSave}
                            className="px-5"
                            loading={isLoading}
                        >
                            Save Settings
                        </Button>
                    </Flex>
                );

                return (
                    <Drawer
                        open={open}
                        onClose={handleClose}
                        title={<LeftHeader title="Settings" />}
                        closable={false}
                        width={480}
                        destroyOnHidden
                        footer={drawerFooter}
                        styles={{
                            header: { borderBottom: '1px solid #F1F1F1', padding: '10px 16px' },
                            body: { padding: '10px 16px 12px' },
                        }}
                    >
                        {isLoading && !settings ? (
                            <Flex justify="center" align="center" className="h-full">
                                <Spin />
                            </Flex>
                        ) : (
                            <SettingsForm />
                        )}
                    </Drawer>
                );
            }}
        </Formik>
    );
};

export default React.memo(SettingsDrawer);
