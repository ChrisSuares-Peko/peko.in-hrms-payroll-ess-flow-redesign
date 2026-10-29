import React from 'react';

import { ShareAltOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import QuotationTimeline from './QuotationTimeline';
import { GetInvoiceByIdResponse } from '../../types/invoice';

interface Props {
    invoiceData: GetInvoiceByIdResponse | null;
    isLoading: boolean;
    onSendQuotation: () => void;
    isSending: boolean;
    children?: React.ReactNode;
}

const QuotationDetailsPanel = ({ invoiceData, isLoading, onSendQuotation, isSending, children }: Props) => {
    const navigate = useNavigate();
    const isConverted = invoiceData?.status === 'CONVERTED';

    return (
        <Flex vertical gap={16} className="w-full">
            <Flex gap={12}>
                <Button
                    className="flex-1"
                    icon={<ShareAltOutlined />}
                    loading={isSending}
                    disabled={isConverted}
                    onClick={onSendQuotation}
                >
                    Send to Customer
                </Button>
                <Button
                    type="primary"
                    danger
                    className="flex-1"
                    disabled={isConverted}
                    onClick={() =>
                        navigate(
                            `/${paths.invoice.index}/${paths.invoice.create}?fromQuotation=${invoiceData?.id}`
                        )
                    }
                >
                    {isConverted ? 'Converted' : 'Convert to Invoice'}
                </Button>
            </Flex>

            <QuotationTimeline invoiceData={invoiceData} />

            {children}
        </Flex>
    );
};

export default QuotationDetailsPanel;
