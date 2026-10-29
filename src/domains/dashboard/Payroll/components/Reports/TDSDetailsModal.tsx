import React from 'react';

import { Button, Card, Col,Row, Space, Spin, Typography } from 'antd';

import DrawerModal from '@components/atomic/DrawerModal';

import { TDSReportbyEmployee } from '../../types/types';

type TDSDetailsModalProps = {
    open: boolean;
    handleCancel: () => void;
    selectedRow: TDSReportbyEmployee | null;
    loading?: boolean;
};

const { Text, Title } = Typography;

const formatCurrency = (amount?: number | null) => `₹${Number(amount ?? 0).toLocaleString('en-IN')}`;

const TDSDetailsModal = ({ open, handleCancel, selectedRow, loading }: TDSDetailsModalProps) => {
    const employeeDetails = [
        { label: 'Name', value: selectedRow?.employeeDetails?.name || '-' },
        { label: 'Email', value: selectedRow?.employeeDetails?.email || '-' },
        { label: 'Tax Regime', value: selectedRow?.taxRegime || selectedRow?.texRegime || 'N/A' },
        // { label: 'Financial Year', value: selectedRow?.fy || '-' },
        // { label: 'Gross Annual', value: formatCurrency(selectedRow?.grossAnnual) },
        { label: 'Exemptions', value: formatCurrency(selectedRow?.exemptions) },
        { label: 'Taxable Income', value: formatCurrency(selectedRow?.taxableIncome) },
        {
            label: 'Total Tax Payable (Annual)',
            value: formatCurrency(selectedRow?.totalTax),
            strong: true,
        },
        {
            label: 'Monthly TDS Deduction',
            value: formatCurrency(selectedRow?.monthlyTds),
            strong: true,
        },
        {
            label: 'TDS Frequency',
            value: selectedRow?.tdsFrequency || '-',
            strong: true,
        },
    ];

    return (
        <DrawerModal
            open={open}
            // onCancel={handleCancel}
            // width={760}
            handleCancel={handleCancel}
            closeIcon
            modalTitle="TDS Details"

            footer={
                <Button danger onClick={handleCancel}>
                    Close
                </Button>
            }
        >
            <Spin spinning={!!loading}>
            <Space direction="vertical" size={28} className="w-full">
                <Space direction="vertical" size={20} className="w-full">
                    <Title level={5}>Employee Details</Title>

                    <Row gutter={[16, 16]}>
                        {employeeDetails.map(item => (
                            <React.Fragment key={item.label}>
                                <Col xs={24} md={12}>
                                    <Text className={item.strong ? 'font-semibold' : ''}>
                                        {item.label}
                                    </Text>
                                </Col>
                                <Col xs={24} md={12} className="md:text-right">
                                    <Text className={item.strong ? 'font-semibold' : ''}>
                                        {item.value}
                                    </Text>
                                </Col>
                            </React.Fragment>
                        ))}
                    </Row>
                </Space>

                <Card className="rounded-3xl bg-[#F5F5F5]">
                    <Space direction="vertical" size={20} className="w-full">
                        <Title level={5}>Tax Calculation</Title>

                        <Card className="rounded-2xl">
                            <Space direction="vertical" size={10} className="w-full">
                                {selectedRow?.slabBreakdown?.length ? (
                                    selectedRow.slabBreakdown.map((item, index) => (
                                        <Row justify="space-between" key={`${item.from}-${item.to}-${index}`}>
                                            <Col>
                                                <Text>
                                                    {item.to != null
                                                        ? `₹${(item.from ?? 0).toLocaleString('en-IN')} - ₹${item.to.toLocaleString('en-IN')} @ ${item.rate ?? 0}%`
                                                        : `Above ₹${(item.from ?? 0).toLocaleString('en-IN')} @ ${item.rate ?? 0}%`}{' '}
                                                    (Taxable: {formatCurrency(item.taxableAmount ?? 0)})
                                                </Text>
                                            </Col>
                                            <Col>
                                                <Text>{`= ${formatCurrency(item.tax)}`}</Text>
                                            </Col>
                                        </Row>
                                    ))
                                ) : (
                                    <Text type="secondary">No slab breakdown available</Text>
                                )}
                            </Space>
                        </Card>

                        <Space direction="vertical" size={12} className="w-full">
                            <Row justify="space-between">
                                <Col>
                                    <Text>Total Tax (before Cess)</Text>
                                </Col>
                                <Col>
                                    <Text>{`= ${formatCurrency(selectedRow?.taxBeforeRebate)}`}</Text>
                                </Col>
                            </Row>
                            <Row justify="space-between">
                                <Col>
                                    <Text>Less: Rebate</Text>
                                </Col>
                                <Col>
                                    <Text>{`= ${formatCurrency(selectedRow?.rebate)}`}</Text>
                                </Col>
                            </Row>
                            <Row justify="space-between">
                                <Col>
                                    <Text>Add: 4% Health &amp; Education Cess</Text>
                                </Col>
                                <Col>
                                    <Text>{`= ${formatCurrency(selectedRow?.cess)}`}</Text>
                                </Col>
                            </Row>
                            <Row justify="space-between">
                                <Col>
                                    <Text>Total Tax Payable (Annual)</Text>
                                </Col>
                                <Col>
                                    <Text>{formatCurrency(selectedRow?.totalTax)}</Text>
                                </Col>
                            </Row>
                            <Row justify="space-between">
                                <Col>
                                    <Text className="font-semibold">Monthly TDS Deduction</Text>
                                </Col>
                                <Col>
                                    <Text className="font-semibold">
                                        {formatCurrency(selectedRow?.monthlyTds)}
                                    </Text>
                                </Col>
                            </Row>
                        </Space>
                    </Space>
                </Card>
            </Space>
            </Spin>
        </DrawerModal>
    );
};

export default TDSDetailsModal;
