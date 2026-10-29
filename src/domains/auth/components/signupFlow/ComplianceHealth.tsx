import React from 'react';

import { Flex, Typography } from 'antd';

import CompanyIdentificationForm from '../forms/ComplianceForm';

const { Title, Text } = Typography;

const ComplianceHealth = () => (
    <Flex
        vertical
        align="center"
        justify="center"
        className="min-h-svh"
        style={{ padding: '40px 16px' }}
    >
        {/* Header */}
        <Flex vertical align="center" gap={8} style={{ marginBottom: 32 }}>
            <Title level={2} style={{ margin: 0 }}>
                Peko
            </Title>
            <Text type="secondary">
                Welcome to Peko. Let&apos;your Compliance Health Score
            </Text>
        </Flex>

        {/* Main Card */}
      
            <CompanyIdentificationForm />
       
    </Flex>
);

export default ComplianceHealth;