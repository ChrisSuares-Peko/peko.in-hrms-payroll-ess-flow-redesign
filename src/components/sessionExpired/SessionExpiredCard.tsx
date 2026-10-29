import { Flex } from 'antd';

import SessionExpiredHeader from './SessionExpiredHeader';
import SessionExpiredMessage from './SessionExpiredMessage';

const SessionExpiredCard = () => (
    <Flex
        vertical
        align="center"
        justify="center"
        gap={24}
        className="w-full max-w-xl xl:max-w-2xl bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-6 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12"
    >
        <SessionExpiredHeader />
        <SessionExpiredMessage />
    </Flex>
);

export default SessionExpiredCard;
