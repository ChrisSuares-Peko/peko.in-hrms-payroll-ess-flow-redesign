import { Flex, Tabs, Typography } from 'antd';

import EmailTemplateKeysTab from './EmailTemplateKeysTab';
import EmailTemplateServicesTab from './EmailTemplateServicesTab';
import EmailTemplateVariablesTab from './EmailTemplateVariablesTab';

const EmailTemplateVariablesPage = () => (
    <Flex vertical gap={20}>
        <Flex vertical gap={4}>
            <Typography.Text className="text-lg font-medium sm:text-xl">
                Email Template Variables
            </Typography.Text>
            <Typography.Text className="text-textGray text-sm">
                Manage the services and keys email templates are organized under, and document the $
                {'{variable}'} placeholders each key supports.
            </Typography.Text>
        </Flex>
        <Tabs
            defaultActiveKey="services"
            items={[
                { key: 'services', label: 'Services', children: <EmailTemplateServicesTab /> },
                { key: 'keys', label: 'Keys', children: <EmailTemplateKeysTab /> },
                {
                    key: 'variables',
                    label: 'Variables',
                    children: <EmailTemplateVariablesTab />,
                },
            ]}
        />
    </Flex>
);

export default EmailTemplateVariablesPage;
