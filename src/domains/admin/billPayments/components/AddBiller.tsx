/* eslint-disable react/prop-types */
import { useState } from 'react';

import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input, Upload, message } from 'antd';

import { AddBillerPayload } from '../types/billers';

interface AddBillerProps {
    onAdd: (payload: AddBillerPayload) => Promise<boolean>;
    onExcelUpload: (file: File) => void;
    isLoading?: boolean;
}

const AddBiller: React.FC<AddBillerProps> = ({ onAdd, onExcelUpload, isLoading }) => {
    const [form] = Form.useForm<AddBillerPayload>();
    const [isAdding, setIsAdding] = useState(false);


    const handleAdd = async () => {
        let values: AddBillerPayload;
        try {
            values = await form.validateFields();
        } catch {
            return;
        }

        setIsAdding(true);
        const success = await onAdd(values);
        if (success) {
            form.resetFields();
        } else {
            form.resetFields(['billerId']);
        }
        setIsAdding(false);
    };

    const handleFileUpload = (file: File) => {
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        if (!isExcel) {
            message.error('Please upload an Excel file (.xlsx or .xls)');
            return false;
        }
        onExcelUpload(file);
        return false;
    };

    const uploadProps = {
        beforeUpload: handleFileUpload,
        accept: '.xlsx,.xls',
        showUploadList: false,
    };

    return (
        <Flex vertical gap={16}>
            <Form form={form} layout="vertical">
                <Flex gap={12} wrap="wrap">
                    <Form.Item
                        name="billerId"
                        label="Biller ID"
                        rules={[
                            { required: true, message: 'Biller ID is required' },
                            { len: 14, message: 'Biller ID must be exactly 14 characters' },
                        ]}
                        style={{ flex: '1 1 180px', marginBottom: 0 }}
                    >
                        <Input
                            placeholder="14-character Biller ID"
                            maxLength={14}
                            disabled={isLoading || isAdding}
                            onChange={e => {
                                const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                                form.setFieldValue('billerId', clean);
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="billerName"
                        label="Biller Name"
                        style={{ flex: '2 1 220px', marginBottom: 0 }}
                    >
                        <Input placeholder="e.g. BESCOM" disabled={isLoading || isAdding} />
                    </Form.Item>

                    <Form.Item
                        name="billerCategory"
                        label="Category"
                        style={{ flex: '1 1 160px', marginBottom: 0 }}
                    >
                        <Input placeholder="e.g. Electricity" disabled={isLoading || isAdding} />
                    </Form.Item>

                    <Form.Item
                        name="billerCoverage"
                        label="Coverage"
                        style={{ flex: '1 1 140px', marginBottom: 0 }}
                    >
                        <Input placeholder="e.g. IND-KA" disabled={isLoading || isAdding} />
                    </Form.Item>

                    <Form.Item label=" " style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            loading={isAdding}
                            disabled={isLoading}
                        >
                            Add & Fetch
                        </Button>
                    </Form.Item>
                </Flex>
            </Form>

            <Flex gap={8} align="center">
                <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />} disabled={isLoading}>
                        Upload Excel File
                    </Button>
                </Upload>
                <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                    Excel columns: billerId · blr_name · blr_category_name · blr_coverage
                </span>
            </Flex>
        </Flex>
    );
};

export default AddBiller;
