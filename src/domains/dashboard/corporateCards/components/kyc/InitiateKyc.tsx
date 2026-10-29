import { LockOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import RequirementRow from './RequirementRow';
import { KYC_INTRO, KYC_REQUIREMENTS } from '../../utils/kycData';

const { Title, Text } = Typography;

interface InitiateKycProps {
    onInitiate: () => void;
    loading?: boolean;
}

/** First-time KYC gate: explains the process and lists what to keep ready. */
const InitiateKyc = ({ onInitiate, loading }: InitiateKycProps) => (
    <Flex vertical>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-4 pt-1 xl:pb-8 xl:pt-2">
            <div className="flex flex-col items-center gap-4 text-center">
                <span className="rounded-full bg-bgLightPink px-4 py-1.5 text-sm text-textLightRed">
                    {KYC_INTRO.badge}
                </span>
                <Title level={3} className="!mb-0 !text-textHeadings">
                    {KYC_INTRO.title}
                </Title>
                <Text className="text-base text-textBody">{KYC_INTRO.description}</Text>
            </div>

            <div className="flex flex-col gap-6 rounded-3xl border border-borderGray bg-white p-6 xl:p-9">
                <Text className="text-lg font-medium text-textHeadings">
                    {KYC_INTRO.checklistTitle}
                </Text>
                <div className="flex flex-col gap-4">
                    {KYC_REQUIREMENTS.map(item => (
                        <RequirementRow key={item.key} item={item} />
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <Text className="text-center text-sm text-textBody">
                    {KYC_INTRO.termsPrefix}
                    <a
                        href={KYC_INTRO.termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="!text-textLightRed hover:!underline"
                    >
                        {KYC_INTRO.termsLinkLabel}
                    </a>{' '}
                    {KYC_INTRO.termsSuffix}
                </Text>
                <Button
                    type="primary"
                    block
                    loading={loading}
                    onClick={onInitiate}
                    className="!h-14 text-base font-medium"
                >
                    {KYC_INTRO.ctaLabel}
                </Button>
                <span className="flex items-center gap-1.5 text-xs text-textBody">
                    <LockOutlined />
                    {KYC_INTRO.securityNote}
                </span>
            </div>
        </div>
    </Flex>
);

export default InitiateKyc;
