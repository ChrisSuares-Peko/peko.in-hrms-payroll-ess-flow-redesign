import React from 'react';

import { AimOutlined, CheckCircleFilled, EditOutlined, GlobalOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Typography } from 'antd';

interface JurisdictionSummaryProps {
    countryName: string;
    countryFlag?: string;
    countryCode?: string;
    companyTypeLabel: string;
    freezoneLabel?: string;
    onChange: () => void;
    onResetCountry?: () => void;
    onResetCompanyType?: () => void;
    onResetFreezone?: () => void;
}

const JurisdictionSummary: React.FC<JurisdictionSummaryProps> = ({
    countryName,
    countryFlag,
    countryCode,
    companyTypeLabel,
    freezoneLabel,
    onChange,
    onResetCountry,
    onResetCompanyType,
    onResetFreezone,
}) => {
    const stepButtonStyle: React.CSSProperties = {
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'inline-block',
    };

    const countryHandler = onResetCountry ?? onChange;
    const typeHandler = onResetCompanyType;
    const freezoneHandler = onResetFreezone;

    return (
        <Flex
            vertical
            gap={20}
            className="rounded-3xl bg-white"
            style={{
                border: '1px solid #E5E7EB',
                padding: 24,
                boxShadow: '0px 1.66px 16.56px 1.52px rgba(0, 0, 0, 0.04)',
            }}
        >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex align="center" gap={10}>
                    <CheckCircleFilled style={{ color: '#26A411', fontSize: 22 }} />
                    <Typography.Text className="text-base font-semibold text-neutral-900">
                        Jurisdiction Selected
                    </Typography.Text>
                </Flex>
                <Button icon={<EditOutlined />} onClick={onChange} danger>
                    Change
                </Button>
            </Flex>

            <Divider style={{ margin: 0, borderColor: '#E5E7EB' }} />

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <button
                        type="button"
                        onClick={countryHandler}
                        style={stepButtonStyle}
                        title="Change country"
                    >
                        <Flex vertical gap={6}>
                            <Typography.Text className="text-xs text-neutral-500">
                                Country
                            </Typography.Text>
                            <Flex align="center" gap={10}>
                                {countryFlag && (
                                    <div
                                        style={{
                                            width: 28,
                                            height: 20,
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                            background: '#F3F4F6',
                                        }}
                                    >
                                        <img
                                            src={countryFlag}
                                            alt={countryName}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </div>
                                )}
                                <Typography.Text className="text-sm font-medium text-neutral-900">
                                    {countryName}
                                    {countryCode ? ` (${countryCode === 'AE' ? 'UAE' : countryCode})` : ''}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </button>
                </Col>
                {companyTypeLabel && (
                    <Col xs={24} md={8}>
                        <button
                            type="button"
                            onClick={typeHandler}
                            disabled={!typeHandler}
                            style={{
                                ...stepButtonStyle,
                                cursor: typeHandler ? 'pointer' : 'default',
                            }}
                            title={typeHandler ? 'Change company type' : undefined}
                        >
                            <Flex vertical gap={6}>
                                <Typography.Text className="text-xs text-neutral-500">
                                    Company Type
                                </Typography.Text>
                                <Flex align="flex-start" gap={8}>
                                    <AimOutlined style={{ color: '#FF4F4F' }} />
                                    <Typography.Text className="text-sm font-medium text-neutral-900">
                                        {companyTypeLabel}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </button>
                    </Col>
                )}
                {freezoneLabel && (
                    <Col xs={24} md={8}>
                        <button
                            type="button"
                            onClick={freezoneHandler}
                            disabled={!freezoneHandler}
                            style={{
                                ...stepButtonStyle,
                                cursor: freezoneHandler ? 'pointer' : 'default',
                            }}
                            title={freezoneHandler ? 'Change freezone' : undefined}
                        >
                            <Flex vertical gap={6}>
                                <Typography.Text className="text-xs text-neutral-500">
                                    Jurisdiction / Freezone
                                </Typography.Text>
                                <Flex align="flex-start" gap={8}>
                                    <GlobalOutlined style={{ color: '#FF4F4F' }} />
                                    <Typography.Text className="text-sm font-medium text-neutral-900">
                                        {freezoneLabel}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </button>
                    </Col>
                )}
            </Row>
        </Flex>
    );
};

export default JurisdictionSummary;
