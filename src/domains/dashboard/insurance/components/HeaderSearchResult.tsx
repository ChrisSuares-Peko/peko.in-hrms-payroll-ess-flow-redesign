import React from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Flex, Typography, theme } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';

const HeadSearchResult: React.FC<{ description: string; title?: string }> = ({
    description,
    title,
}) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();

    return (
        <Content className="border border-neutral-5 bg-white rounded-sm py-4 px-6">
            <Flex className="sm:justify-between flex-col sm:flex-row">
                <Typography.Text className="text-lg font-medium">
                    {title ?? ' Showing plans 4 based on'}
                </Typography.Text>
                <Link to="..">
                    <Typography.Text
                        className="text-base font-normal cursor-pointer"
                        style={{ color: colorPrimary }}
                    >
                        Edit <EditOutlined className="ml-1" />
                    </Typography.Text>
                </Link>
            </Flex>

            <Typography.Text>{description}</Typography.Text>
        </Content>
    );
};

export default HeadSearchResult;
