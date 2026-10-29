import React from 'react';

import { Card, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

type InfoCardProps = {
    title: string;
    description: string;
    link?: string;
};

const InfoCard: React.FC<InfoCardProps> = ({ title, description, link }) => (
    <Card
        style={{
            borderRadius: 16,
            backgroundColor: '#FAFAFA',
            // boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
        bodyStyle={{ padding: 24 }}
    >
        <Title level={4} style={{ marginBottom: 12 }}>
            {title}
        </Title>
        <Paragraph style={{ fontSize: 14, color: '#595959', whiteSpace: 'pre-line' }}>
            {description}{' '}
            {link && (
                <Link to={link} target="_blank" rel="noopener noreferrer">
                    https://www.esic.gov.in/benefits
                </Link>
            )}
        </Paragraph>
    </Card>
);

export default InfoCard;
