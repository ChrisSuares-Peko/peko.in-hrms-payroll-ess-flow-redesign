import {
    CheckCircleOutlined,
    ClockCircleFilled,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, Card, Flex } from 'antd';

import { ENACH_USE_CASES } from '../../../constants/invoiceDetails';
import InfoItem from '../../shared/InfoItem';
import LeftHeader from '../../shared/LeftHeader';

type Props = {
    onBack: () => void;
    onNext: () => void;
};

const MandateInfo = ({ onBack, onNext }: Props) => (
    <Flex vertical gap={20}>
        <LeftHeader
            title="eNACH Mandate"
            description="eNACH allows you to automatically debit your customer's bank account on a recurring basis."
        />

        <Card className="rounded-2xl">
            <Flex vertical gap={10}>
                <LeftHeader title="Supported Use Cases" />
                <Flex vertical gap={8}>
                    {ENACH_USE_CASES.map(({ title, description }) => (
                        <InfoItem
                            key={title}
                            icon={<CheckCircleOutlined className="text-green-600" />}
                            title={title}
                            description={description}
                        />
                    ))}
                </Flex>
            </Flex>
        </Card>

        <Card className="rounded-2xl">
            <Flex vertical gap={10}>
                <LeftHeader title="Requirements" />
                <Flex vertical gap={8}>
                    <InfoItem
                        icon={<SafetyCertificateOutlined className="text-green-600" />}
                        iconBgClass="bg-[#EAF4FF]"
                        title="Customer Authorization"
                        description="Your customer needs Net Banking or Debit Card to approve the mandate"
                        className="bg-[#F8FAFC] border-1"
                    />
                    <InfoItem
                        icon={<ClockCircleFilled className="text-yellow-500" />}
                        iconBgClass="bg-[#FFEDA5]"
                        title="Approval Timeline"
                        description="Mandate approval may take 1 to 2 working days after customer authorization"
                        className="bg-[#FFFBEB] border-1"
                    />
                </Flex>
            </Flex>
        </Card>

        <Flex gap={12}>
            <Button block className="h-10 text-[#475569]" onClick={onBack}>
                Go Back
            </Button>
            <Button block type="primary" danger className="h-10" onClick={onNext}>
                Create Mandate
            </Button>
        </Flex>
    </Flex>
);

export default MandateInfo;
