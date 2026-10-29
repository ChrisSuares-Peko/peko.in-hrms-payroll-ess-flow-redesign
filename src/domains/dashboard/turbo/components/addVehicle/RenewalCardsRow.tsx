import { Col } from 'antd';
import dayjs from 'dayjs';

import RenewalCards from './RenewalCards';
import { renewalCardsData } from '../../utils/data';

const RenewalCardsRow = ({ verifyRcResponse }: any) => (
    <>
        {renewalCardsData.map(item => {
            let dynamicRenewalDate = '';

            if (item.title === 'Insurance') {
                dynamicRenewalDate = verifyRcResponse?.insuranceExpiry
                    ? dayjs(verifyRcResponse.insuranceExpiry).format('YYYY-MM-DD')
                    : 'N/A';
            } else if (item.title === 'Registration') {
                dynamicRenewalDate = verifyRcResponse?.rawData?.rc_expiry_date
                    ? dayjs(verifyRcResponse.rawData.rc_expiry_date).format('YYYY-MM-DD')
                    : 'N/A';
            } else if (item.title === 'Pollution') {
                dynamicRenewalDate = verifyRcResponse?.pucValidUpto
                    ? dayjs(verifyRcResponse.pucValidUpto).format('YYYY-MM-DD')
                    : 'N/A';
            } else if (item.title === 'Fitness Upto') {
                dynamicRenewalDate = 'N/A'; // Fitness date not available
            }

            return (
                <Col xs={24} md={6} key={item.title}>
                    <RenewalCards
                        icon={item.icon}
                        title={item.title}
                        renewalDate={dynamicRenewalDate}
                        bgColor={item.bgColor}
                    />
                </Col>
            );
        })}
    </>
);

export default RenewalCardsRow;
