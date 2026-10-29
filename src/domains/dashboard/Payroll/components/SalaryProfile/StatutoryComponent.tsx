import React, { useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Button, Typography, Row, Col, Card, Badge, Flex } from 'antd';

import EPFModal from '../modals/EPFModal';
import ESIFormModal from '../modals/ESIFormModal';
import LWFModal from '../modals/LWFModal';
import PTModal from '../modals/PTModal';

interface StatutoryItemProps {
    title: string;
    status: string;
    contributions: { label: string; value: string[] }[];
    details: { label: string; value: string }[];
    ModalComponent: React.FC<{ open: boolean; handleCancel: () => void }>;
}

const StatutoryItem: React.FC<StatutoryItemProps> = ({
    title,
    status,
    contributions,
    details,
    ModalComponent,
}) => {
    const [openModal, setOpenModal] = useState(false);

    return (
        <Card bordered style={{ minHeight: '330px' }} className="p-4">
            <Flex justify="space-between" align="center" className="mb-4">
                <Flex align="center">
                    <Typography.Text className="font-semibold" style={{ fontSize: '18px' }}>
                        {title}
                    </Typography.Text>
                    <Badge
                        status="success"
                        text={status}
                        style={{ marginLeft: '16px', fontSize: '14px', color: '#027A48' }}
                    />
                </Flex>
                <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => setOpenModal(true)}
                    style={{ color: '#E30000' }}
                />
            </Flex>
            <Row gutter={[16, 16]}>
                {contributions.map((contribution, index) => (
                    <Col span={12} key={index}>
                        <Typography.Text
                            className="font-medium text-[#434343]"
                            style={{ fontSize: '15px' }}
                        >
                            {contribution.label}
                        </Typography.Text>
                        {contribution.value.map((line, i) => (
                            <Typography.Paragraph
                                className="text-[#838383]"
                                style={{ margin: 0, fontSize: '14px' }}
                                key={i}
                            >
                                {line}
                            </Typography.Paragraph>
                        ))}
                    </Col>
                ))}
                {details.map((detail, index) => (
                    <Col span={12} key={index}>
                        <Typography.Text
                            className="font-medium text-[#434343]"
                            style={{ fontSize: '15px' }}
                        >
                            {detail.label}
                        </Typography.Text>
                        <Typography.Paragraph
                            className="text-[#838383]"
                            style={{ margin: 0, fontSize: '14px' }}
                        >
                            {detail.value}
                        </Typography.Paragraph>
                    </Col>
                ))}
            </Row>
            {openModal && (
                <ModalComponent open={openModal} handleCancel={() => setOpenModal(false)} />
            )}
        </Card>
    );
};

const StatutoryComponents: React.FC = () => {
    const statutoryItems = [
        {
            title: 'EPF',
            status: 'Active',
            contributions: [
                { label: 'EPF Contribution Rate', value: ['Employer : 3.25%', 'Employee : 0.75%'] },
                { label: 'Contribution Amount', value: ['Employer : ₹XXXX', 'Employee : ₹YYYY'] },
            ],
            details: [
                { label: 'EPF Number', value: '566788765434332232' },
                { label: 'UAN', value: 'IGHH676776e676' },
                { label: 'Effective Date', value: '17/04/2024' },
                { label: 'Total EPF Balance', value: '₹XXXX' },
            ],
            ModalComponent: EPFModal,
        },
        {
            title: 'ESI',
            status: 'Active',
            contributions: [
                { label: 'ESI Contribution Rate', value: ['Employer : 3.25%', 'Employee : 0.75%'] },
                { label: 'Contribution Amount', value: ['Employer : ₹XXXX', 'Employee : ₹YYYY'] },
            ],
            details: [
                { label: 'ESI Number', value: 'ESI123456789' },
                { label: 'Effective Date', value: '17/04/2024' },
            ],
            ModalComponent: ESIFormModal,
        },
        {
            title: 'Labor Welfare Fund',
            status: 'Active',
            contributions: [
                { label: 'LWF Contribution Rate', value: ['Employer : 3.25%', 'Employee : 0.75%'] },
                { label: 'Contribution Amount', value: ['Employer : ₹XXXX', 'Employee : ₹YYYY'] },
            ],
            details: [{ label: 'Effective Date', value: '17/04/2024' }],
            ModalComponent: LWFModal,
        },
        {
            title: 'Professional Tax',
            status: 'Active',
            contributions: [
                { label: 'PT Rate', value: ['3.25%'] },
                { label: 'Contribution Amount', value: ['₹XXXX'] },
            ],
            details: [
                { label: 'PT Number', value: '566788765434332232' },
                { label: 'Effective Date', value: '17/04/2024' },
            ],
            ModalComponent: PTModal,
        },
    ];

    return (
        <Flex vertical gap={24}>
            <Typography.Text className="font-semibold" style={{ fontSize: '18px' }}>
                Statutory Components
            </Typography.Text>
            <Row gutter={[24, 24]} align="top">
                {statutoryItems.map((item, index) => (
                    <Col xs={24} md={12} key={index}>
                        <StatutoryItem {...item} />
                    </Col>
                ))}
            </Row>
        </Flex>
    );
};

export default StatutoryComponents;
