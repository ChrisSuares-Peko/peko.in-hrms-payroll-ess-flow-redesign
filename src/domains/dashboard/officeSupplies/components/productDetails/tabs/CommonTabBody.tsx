import type { FC } from 'react';

import { Flex, Typography } from 'antd';

interface CommonTabBodyProps {
    content: string;
}
const CommonTabBody: FC<CommonTabBodyProps> = ({ content }) => (
    <Flex vertical>
        <Typography.Paragraph
            className="text-sm text-zinc-800 leading-20"
            style={{ whiteSpace: 'pre-line' }}
        >
            {content}
        </Typography.Paragraph>
    </Flex>
);

export default CommonTabBody;
