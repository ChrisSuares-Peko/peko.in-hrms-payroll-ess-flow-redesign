import { useState } from 'react';

import { Button, Card, Form } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import useGeneralApi from '@src/domains/admin/users/hooks/useGeneralApi';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import SummaryStrip from './SummaryStrip';
import TabHeader from './TabHeader';
import { AccountingService } from '../../types/services';

type VendorFormValues = {
    vendorName: string;
    state: string;
    gstNo: string;
    address: string;
    // Comma-separated in the form; split into an array before it reaches onSave.
    vendorEmail: string;
};

// One or more emails separated by commas, optionally spaced (e.g. "a@x.com, b@y.com").
const EMAIL_LIST_PATTERN =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\s*,\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/;

const vendorSchema = Yup.object({
    vendorName: Yup.string().required('Vendor name is required'),
    state: Yup.string(),
    gstNo: Yup.string()
        .trim()
        .uppercase()
        .matches(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])?$/, {
            message: 'Please enter a valid 15-character GSTIN',
            excludeEmptyString: true,
        }),
    address: Yup.string(),
    vendorEmail: Yup.string()
        .required('Please enter at least one email ID')
        .matches(EMAIL_LIST_PATTERN, 'Please enter a valid email ID'),
});

type VendorSavePayload = Omit<VendorFormValues, 'vendorEmail'> & { vendorEmail: string[] };

type VendorTabProps = {
    service: AccountingService;
    onSave: (values: VendorSavePayload) => Promise<boolean>;
};

const VendorTab = ({ service, onSave }: VendorTabProps) => {
    const dispatch = useAppDispatch();
    const { stateData } = useGeneralApi();
    const [vendor, setVendor] = useState<VendorFormValues>(() => ({
        vendorName: service.vendor?.vendorName ?? '',
        state: service.vendor?.state ?? '',
        gstNo: service.vendor?.gstNo ?? '',
        address: service.vendor?.address ?? '',
        vendorEmail: service.vendor?.vendorEmail?.join(', ') ?? '',
    }));

    return (
        <Formik
            initialValues={vendor}
            validationSchema={vendorSchema}
            enableReinitialize
            onSubmit={async values => {
                const vendorEmail = values.vendorEmail
                    .split(/[,\s]+/)
                    .filter(email => email.trim() !== '');
                const success = await onSave({ ...values, vendorEmail });
                if (success) {
                    setVendor(values);
                    dispatch(
                        showToast({
                            description: `Vendor details saved for ${service.serviceProvider}`,
                            variant: 'success',
                        })
                    );
                } else {
                    dispatch(
                        showToast({
                            description: 'Failed to save vendor details. Please try again.',
                            variant: 'error',
                        })
                    );
                }
            }}
        >
            {formik => (
                <Form
                    layout="vertical"
                    onFinish={() => formik.handleSubmit()}
                    className="max-w-[820px]"
                >
                    <TabHeader
                        title="Vendor"
                        description={`Vendor of record for ${service.serviceProvider}, used on journals and payables.`}
                        action={
                            <Button type="primary" htmlType="submit" loading={formik.isSubmitting}>
                                Save changes
                            </Button>
                        }
                    />
                    <SummaryStrip
                        items={[
                            { label: 'Vendor Name', value: vendor.vendorName || '-' },
                            { label: 'GST Number', value: vendor.gstNo || '-' },
                            { label: 'State', value: vendor.state || '-' },
                        ]}
                    />
                    <Card className="mt-4 rounded-xl border border-borderCard shadow-none">
                        <div className="grid gap-x-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <TextInput
                                    name="vendorName"
                                    label="Vendor Name"
                                    type="text"
                                    isRequired
                                />
                            </div>
                            <SelectInput
                                name="state"
                                label="State"
                                placeholder="Select state"
                                options={stateData || []}
                            />
                            <TextInput
                                name="gstNo"
                                label="GST Number"
                                type="text"
                                allowUpperCaseOnly
                            />
                            <div className="sm:col-span-2">
                                <InputTextArea
                                    name="address"
                                    label="Address"
                                    placeholder="Enter address"
                                    autoSize={{ minRows: 3 }}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <InputTextArea
                                    name="vendorEmail"
                                    label="Vendor Email ID"
                                    placeholder="Enter Vendor Email ID"
                                    isRequired
                                    showToolTip
                                    tooltipText="Multiple email IDs are separated by commas"
                                />
                            </div>
                        </div>
                    </Card>
                </Form>
            )}
        </Formik>
    );
};

export default VendorTab;
