import React from 'react';

import { CopyOutlined } from '@ant-design/icons';
import { Typography, Input, Button, Space, message, Flex } from 'antd';

interface OidcDisplayProps {
    data?: {
        oauth_client?: {
            client_id?: string;
            client_secret?: string;
        };
    };
}

const OidcDisplay: React.FC<OidcDisplayProps> = ({ data }) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('Copied to clipboard!');
    };

    return (
        <Flex vertical justify="center" className="gap-2 border p-3 my-4 rounded">
            {data?.oauth_client?.client_id && (
                <Space>
                    <Typography.Text strong>Client ID:</Typography.Text>
                    <Typography.Text>{data.oauth_client.client_id}</Typography.Text>
                    <Button
                        type="link"
                        danger
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(data.oauth_client!.client_id!)}
                    />
                </Space>
            )}

            {data?.oauth_client?.client_secret && (
                <Space>
                    <Typography.Text strong>Client Secret:</Typography.Text>
                    <Input.Password
                        value={data.oauth_client.client_secret}
                        readOnly
                        visibilityToggle
                        style={{ width: 200 }}
                    />
                    <Button
                        type="link"
                        danger
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(data.oauth_client!.client_secret!)}
                    />
                </Space>
            )}
        </Flex>
    );
};

export default OidcDisplay;
