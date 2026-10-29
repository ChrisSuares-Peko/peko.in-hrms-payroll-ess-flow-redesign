import { DownloadOutlined, LeftOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import PaymentDetailsSkeleton from './PaymentDetailsSkeleton';
import CustomerInformation from './paymentTracking/CustomerInformation';
import LinkedInvoice from './paymentTracking/LinkedInvoice';
import PaymentReceiptPreview from './paymentTracking/PaymentReceiptPreview';
import PaymentSummary from './paymentTracking/PaymentSummary';
import TransactionTimeline from './paymentTracking/TransactionTimeline';
import usePaymentDetails from '../../hooks/usePaymentDetails';

type PaymentDetailsProps = {
    id: string;
    onBack: () => void;
};

const PaymentDetails = ({ id, onBack }: PaymentDetailsProps) => {
    const { data, isLoading, downloadReceipt, isDownloading } = usePaymentDetails(id);

    return (
        <Flex vertical gap={0} className="py-3">
            {/* Back nav */}
            <Flex align="center" gap={6} className="mb-4 cursor-pointer w-fit" onClick={onBack}>
                <LeftOutlined className="text-gray-500 text-xs" />
                <Typography.Text className="text-gray-700 text-sm leading-5">Back</Typography.Text>
            </Flex>

            {isLoading ? (
                <PaymentDetailsSkeleton />
            ) : (
                <Flex gap={24} align="flex-start" className='flex-col lg:flex-row'>
                    {/* ── LEFT COLUMN ── */}
                    <Flex vertical gap={16} className="flex-1 w-full">
                        <PaymentSummary data={data} />
                        <LinkedInvoice data={data} />
                        <TransactionTimeline data={data} />
                    </Flex>

                    {/* ── RIGHT COLUMN ── */}
                    <Flex vertical gap={16} className="w-full lg:w-[360px] flex-shrink-0">
                        <CustomerInformation data={data} />

                        <PaymentReceiptPreview data={data} />

                        <Button
                            icon={<DownloadOutlined />}
                            iconPosition="end"
                            className="w-full h-11 text-[#42526D]"
                            loading={isDownloading}
                            onClick={downloadReceipt}
                        >
                            Download Receipt
                        </Button>
                    </Flex>
                </Flex>
            )}
        </Flex>
    );
};

export default PaymentDetails;
