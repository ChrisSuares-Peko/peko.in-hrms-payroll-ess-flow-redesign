import React from 'react';

import { Card, Typography, Button } from 'antd';

const { Title, Paragraph } = Typography;

const OnboardingDocuments: React.FC = () => (
        <div style={{ padding: '24px' }}>
            <Card>
                <Title level={3}>Onboarding Documents</Title>
                <Paragraph>
                    Please upload the required documents to complete your onboarding process.
                </Paragraph>
                <Button type="primary">Upload Documents</Button>
            </Card>
        </div>
    );

export default OnboardingDocuments;