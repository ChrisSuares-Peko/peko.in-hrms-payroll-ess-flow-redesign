import type { FC } from 'react';

import { Col, Flex, List, Row, Typography } from 'antd';

interface HighlightsTabsProps {
    content: string;
}
const HighlightsTabs: FC<HighlightsTabsProps> = ({ content }) => {
    const data = content?.split('\n');
    return (
        <Flex vertical>
            <List
                dataSource={data}
                renderItem={(item, index) => (
                    <Row
                        className={`py-4 px-6 
                        ${
                            index % 2 === 0 ? 'bg-listBg' : 'bg-white'
                        } ${index === data.length - 1 ? '' : 'border-none'} rounded-lg`}
                    >
                        <Col span={24}>
                            <Typography.Text className="text-gray-600 text-base">
                                {item}
                            </Typography.Text>
                        </Col>
                    </Row>
                )}
            />
        </Flex>
    );
};

export default HighlightsTabs;
