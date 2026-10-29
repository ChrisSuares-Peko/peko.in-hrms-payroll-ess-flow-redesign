import { CheckCircleOutlined } from '@ant-design/icons';
import { Checkbox, Col, Flex, Row } from 'antd';

import DetailCard from './DetailCard';
import { CURRENCY_ACCOUNT_SETTLEMENT_NOTES } from '../../constants/onboarding';
import { CurrencyAccountBusinessDetails } from '../../types/onboarding';
import InfoCard from '../shared/InfoCard';
import LeftHeader from '../shared/LeftHeader';

type Props = {
    data: CurrencyAccountBusinessDetails;
    consent: boolean;
    onConsentChange: (checked: boolean) => void;
};

const ConsentConfirm = ({ data, consent, onConsentChange }: Props) => (
    <Flex vertical gap={24}>
        <LeftHeader
            title="Consent and Confirmation"
            description="Please review the settlement terms and authorise Peko to process payments."
            titleClass="text-base"
        />

        <Row gutter={12}>
            <Col span={12}>
                <DetailCard label="Business" title={data.businessName} className="h-full" />
            </Col>
            <Col span={12}>
                <DetailCard
                    label="Settlement Account"
                    title={`${data.bankName} - ${data.accountNumber}`}
                    subText={data.ifsc}
                    className="h-full"
                />
            </Col>
        </Row>

        <InfoCard
            title="About Settlements"
            items={CURRENCY_ACCOUNT_SETTLEMENT_NOTES}
            itemsIcon={<CheckCircleOutlined className="text-[#43B75D]" />}
        />

        <Flex align="start" gap={8}>
            <Checkbox
                checked={consent}
                onChange={e => onConsentChange(e.target.checked)}
                className="mt-0.5 shrink-0"
            />
            <span className="text-xs text-gray-700 leading-5">
                I confirm that the business details and bank account information provided are
                accurate. I authorise Peko to process payments on behalf of my business and settle
                funds to the registered account.
            </span>
        </Flex>
    </Flex>
);

export default ConsentConfirm;
