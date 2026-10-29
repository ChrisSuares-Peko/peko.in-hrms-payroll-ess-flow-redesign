import React from 'react';

import { Button, Form, Modal, Typography } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';

import { noSurroundingSpaces } from '../../schema';

const { Text } = Typography;

interface DisputeEntry {
    title: string;
    date: string;
    deduction: string;
    leaveType: string;
    category: string;
}

interface RaiseDisputeModalProps {
    open: boolean;
    entry: DisputeEntry | null;
    onCancel: () => void;
    onSubmit: (reason: string) => Promise<boolean>;
}

interface DisputeFormValues {
    reason: string;
    description: string;
}

const reasonOptions = [
    { label: 'I was present on this day', value: 'I was present on this day' },
    { label: 'Punch record was not captured', value: 'Punch record was not captured' },
    { label: 'System error / technical issue', value: 'System error / technical issue' },
    { label: 'Approved leave not reflected', value: 'Approved leave not reflected' },
    { label: 'Other', value: 'Other' },
];

const validationSchema = Yup.object({
    reason: Yup.string().required('Please select a reason'),
    description: noSurroundingSpaces('Additional details')
        .min(10, 'Please provide at least 10 characters')
        .max(200, 'Additional details cannot exceed 200 characters')
        .required('Please describe your dispute'),
});

const initialValues: DisputeFormValues = { reason: '', description: '' };

const RaiseDisputeModal: React.FC<RaiseDisputeModalProps> = ({
    open,
    entry,
    onCancel,
    onSubmit,
}) => (
    <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        centered
        width={520}
        title={null}
        destroyOnClose
        styles={{ content: { padding: 24, borderRadius: 24, overflow: 'hidden' } }}
    >
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
                <Text className="text-valueText font-bold text-lg">Raise a Dispute</Text>
                <Text className="text-titleText text-sm">Submit your dispute for HR review</Text>
            </div>

            {entry && (
                <div className="flex flex-col gap-2">
                    <Text className="text-titleText text-xs font-medium">Deduction Details</Text>
                    <div className="bg-bgGray rounded-xl border border-gray-100 grid grid-cols-3 divide-x divide-gray-200">
                        <div className="flex flex-col items-center gap-1 py-4 px-2">
                            <Text className="text-xs text-titleText">Date</Text>
                            <Text className="text-sm font-semibold text-valueText">
                                {entry.date}
                            </Text>
                        </div>
                        <div className="flex flex-col items-center gap-1 py-4 px-2">
                            <Text className="text-xs text-titleText">Category</Text>
                            <Text className="text-sm font-semibold text-valueText">
                                {entry.category}
                            </Text>
                        </div>
                        <div className="flex flex-col items-center gap-1 py-4 px-2">
                            <Text className="text-xs text-titleText">Deduction</Text>
                            <Text className="text-sm font-semibold text-textRed">
                                -{entry.deduction} {entry.leaveType}
                            </Text>
                        </div>
                    </div>
                </div>
            )}

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                enableReinitialize
                onSubmit={async (values, { resetForm }) => {
                    const reason = `${values.reason} — ${values.description}`;
                    const ok = await onSubmit(reason);
                    if (ok) resetForm();
                }}
            >
                {({ isSubmitting, handleSubmit }) => (
                    <Form
                        onFinish={handleSubmit}
                        layout="vertical"
                        className="flex flex-col gap-4 [&_.ant-form-item]:!mb-0"
                    >
                        <SelectInput
                            name="reason"
                            label="Reason for Dispute"
                            placeholder="Select a reason"
                            options={reasonOptions}
                            isRequired
                        />
                        <TextAreaInput
                            name="description"
                            label="Additional Details"
                            placeholder="Describe why you believe this deduction is incorrect..."
                            isRequired
                            maxLength={200}
                        />
                        <div className="flex gap-3">
                            <Button
                                size="large"
                                onClick={onCancel}
                                className="flex-1 rounded-lg font-medium"
                            >
                                Cancel
                            </Button>
                            <Button
                                danger
                                size="large"
                                htmlType="submit"
                                loading={isSubmitting}
                                className="flex-1 rounded-lg font-medium text-brandColor border-brandColor"
                            >
                                Submit Dispute
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    </Modal>
);

export default RaiseDisputeModal;
