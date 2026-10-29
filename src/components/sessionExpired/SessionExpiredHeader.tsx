import { ClockCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { SESSION_EXPIRED_COPY } from '@utils/sessionExpiredCopy';

const { Title } = Typography;

const SessionExpiredHeader = () => (
    <Flex vertical align="center" justify="center" gap={12} className="w-full">
        <Flex
            align="center"
            justify="center"
            className="rounded-full bg-bgLightPink w-14 h-14 md:w-16 md:h-16"
        >
            <ClockCircleOutlined className="text-iconRed text-2xl md:text-3xl" />
        </Flex>
        <Title
            level={3}
            className="!mb-0 !font-roboto !font-semibold text-center !text-textBlack text-xl md:text-2xl xl:text-[28px]"
        >
            {SESSION_EXPIRED_COPY.title}
        </Title>
    </Flex>
);

export default SessionExpiredHeader;
