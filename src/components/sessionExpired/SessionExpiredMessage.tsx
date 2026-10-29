import { Typography } from 'antd';

import { SESSION_EXPIRED_COPY } from '@utils/sessionExpiredCopy';

const { Paragraph } = Typography;

const SessionExpiredMessage = () => (
    <Paragraph className="!mb-0 text-center font-roboto text-faqText text-sm md:text-base xl:text-lg leading-relaxed">
        {SESSION_EXPIRED_COPY.description}
    </Paragraph>
);

export default SessionExpiredMessage;
