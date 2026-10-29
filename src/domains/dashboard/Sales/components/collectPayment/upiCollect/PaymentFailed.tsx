import { CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import CenteredHeader from '../../shared/CenteredHeader';

type Props = {
    onRetry: () => void;
    onChooseAnother: () => void;
};

const PaymentFailed = ({ onRetry, onChooseAnother }: Props) => (
    <Flex vertical gap={24}>
        <CenteredHeader
            icon={<CloseOutlined className="text-white text-lg" />}
            outerClass="bg-[#FEE2E2]"
            middleClass="bg-[#FCA5A5]"
            innerClass="bg-[#DC2626]"
            title="Payment Failed"
            description="We could not process your payment. Please try again."
        />
        <Flex gap={12}>
            <Button block className="h-10 text-[#475569]" onClick={onChooseAnother}>
                Choose Another Payment Method
            </Button>
            <Button block className="h-10 border-[#DC2626] text-[#DC2626]" onClick={onRetry}>
                Retry Payment <ReloadOutlined />
            </Button>
        </Flex>
        <Typography.Text className="text-xs text-[#475569] text-center block">
            Need help? Contact support at reach@peko.one
        </Typography.Text>
    </Flex>
);

export default PaymentFailed;
