import { useEffect, useState } from 'react';

import { Button, Descriptions, Drawer, Flex, Input, Select, Typography } from 'antd';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { QuoteRequest, QuoteRequestStatus, UpdateQuoteStatusPayload } from '../types/quoteRequests';
import { STATUS_OPTIONS } from '../utils/status';

interface QuoteRequestDrawerProps {
    open: boolean;
    record?: QuoteRequest;
    updating?: boolean;
    handleClose: () => void;
    handleSave: (payload: UpdateQuoteStatusPayload) => Promise<boolean>;
}

const QuoteRequestDrawer = ({
    open,
    record,
    updating,
    handleClose,
    handleSave,
}: QuoteRequestDrawerProps) => {
    const [status, setStatus] = useState<QuoteRequestStatus>('NEW');
    const [remarks, setRemarks] = useState<string>('');

    useEffect(() => {
        if (record) {
            setStatus(record.status);
            setRemarks(record.remarks || '');
        }
    }, [record]);

    const onSave = async () => {
        if (!record) return;
        const ok = await handleSave({ id: record.id, status, remarks });
        if (ok) handleClose();
    };

    return (
        <Drawer
            title="Quote Request Details"
            open={open}
            onClose={handleClose}
            width={460}
        >
            {record && (
                <Flex vertical gap={20}>
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Submitted On">
                            {`${formattedDateOnly(new Date(record.createdAt))} ${formattedTime(
                                new Date(record.createdAt)
                            )}`}
                        </Descriptions.Item>
                        <Descriptions.Item label="Corporate">
                            {record.credential?.name || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Full Name">{record.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Mobile Number">
                            {record.mobileNumber}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">{record.email}</Descriptions.Item>
                        <Descriptions.Item label="Insurance Type">
                            {record.insuranceType}
                        </Descriptions.Item>
                        <Descriptions.Item label="Vehicle Number">
                            {record.vehicleNumber || '-'}
                        </Descriptions.Item>
                    </Descriptions>

                    <Flex vertical gap={6}>
                        <Typography.Text strong>Status</Typography.Text>
                        <Select
                            value={status}
                            options={STATUS_OPTIONS}
                            onChange={value => setStatus(value)}
                            className="w-full"
                        />
                    </Flex>

                    <Flex vertical gap={6}>
                        <Typography.Text strong>Remarks (internal)</Typography.Text>
                        <Input.TextArea
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            placeholder="Add internal notes about this lead"
                            rows={4}
                            maxLength={500}
                            showCount
                        />
                    </Flex>

                    <Flex justify="flex-end" gap={10}>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="primary" danger loading={updating} onClick={onSave}>
                            Save
                        </Button>
                    </Flex>
                </Flex>
            )}
        </Drawer>
    );
};

export default QuoteRequestDrawer;
