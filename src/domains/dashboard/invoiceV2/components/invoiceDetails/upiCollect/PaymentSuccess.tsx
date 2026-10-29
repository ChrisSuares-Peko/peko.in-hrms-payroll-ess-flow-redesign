import { CheckOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

import { UPICollectSuccessData } from '../../../types/invoiceDetails';
import { formatAmount } from '../../../utils/helperFunctions';
import CenteredHeader from '../../shared/CenteredHeader';
import SummaryCard from '../../shared/SummaryCard';

type Props = {
    successData: UPICollectSuccessData;
    onClose: () => void;
};

const PaymentSuccess = ({ successData, onClose }: Props) => (
    <Flex vertical gap={20}>
        <CenteredHeader
            icon={<CheckOutlined className="text-white text-lg" />}
            outerClass="bg-[#E8FAF0]"
            middleClass="bg-[#D1F4E0]"
            innerClass="bg-[#45D483]"
            title="Payment Successful"
            description="Your payment has been processed successfully"
        />
        <SummaryCard
            title="Payment Summary"
            rows={[
                { label: 'Amount', value: formatAmount(Number(successData.amount)) },
                { label: 'Reference ID', value: successData.referenceId },
                { label: 'Date & Time', value: successData.dateTime },
            ]}
        />
        <Button block className="h-10 text-[#475569]" onClick={onClose}>
            View Transactions
        </Button>
    </Flex>
);

export default PaymentSuccess;
