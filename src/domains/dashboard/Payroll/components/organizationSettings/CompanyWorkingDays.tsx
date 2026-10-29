import React from 'react';

import { Row, Col, Typography, Card } from 'antd';

import { getNonWorkingDaysBreakdown, getWorkingDaysInMonth } from '@utils/calculateDate';

type Props = {
    data:any
};

const CompanyWorkingDays = (props: Props) => {
    const totalWorkingDays = 31; // Example value, replace with actual calculation
    const daysWorked =  getWorkingDaysInMonth(2025,1,props?.data?.selectWorkingDays|| []); // Example value, replace with actual calculation
    const nonWorking = getNonWorkingDaysBreakdown(2025,1,props?.data?.selectWorkingDays)
    // Derived once and reused below wherever a daily-salary figure is shown, so the
    // "Salary For 20 Days Worked" line can never drift out of sync with the "Daily Salary"
    // line above it (it previously hardcoded a stale rate from a different working-days
    // example, contradicting whatever daysWorked actually resolves to for this org).
    const dailySalary = daysWorked ? 30000 / daysWorked : 0;
    const formatMoney = (amount: number) =>
        amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    console.log(nonWorking)

    return (
        <Row gutter={[16, 16]}>
            <Col>
                <Typography.Text className="text-sm text-gray-700">
                    When You Select{' '}
                    <span className="text-base font-medium mb-3">
                        &quot;Company Working Days&quot;
                    </span>
                    , The Salary Is Calculated Based On The Total Working Days in a Company Week
                    (Excluding weekends). The Daily Salary Varies Depending On The Number of Working
                    Days.
                </Typography.Text>
            </Col>
            <Card bordered={false} style={{ backgroundColor: 'white', borderRadius: '8px' }}>
                <Col span={24}>
                    <Typography.Text className="text-base font-medium mb-3">
                        Example Calculation For January 2025:
                    </Typography.Text>
                    <Row gutter={[16, 8]}>
                        <Col span={12}>
                            <Typography.Text>Monthly Salary</Typography.Text>
                        </Col>
                        <Col span={12} style={{ textAlign: 'right' }}>
                            <Typography.Text>
                                {new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: 'INR',
                                    maximumFractionDigits: 0,
                                }).format(30000)}
                            </Typography.Text>
                        </Col>
                        <Col span={18}>
                            <Typography.Text>Total Calendar days in january 2025</Typography.Text>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                            <Typography.Text>{totalWorkingDays}</Typography.Text>
                        </Col>
                        <Col span={20}>
                            <Typography.Text>
                                Non Working Days (
                                    {nonWorking
                                        .map((item: { count: number, day: string }) => `${item.count} ${item.day}`)
                                        .join(' + ')
                                    }
                                )
                            </Typography.Text>
                        </Col>
                        <Col span={4} style={{ textAlign: 'right' }}>
                            <Typography.Text>{nonWorking.reduce((a,b)=>a+b.count,0)}</Typography.Text>
                        </Col>
                        <Col span={18}>
                            <Typography.Text>Company Working Days</Typography.Text>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                            <Typography.Text>{daysWorked}</Typography.Text>
                        </Col>
                        <Col span={18}>
                            <Typography.Text>Days Worked By Employee</Typography.Text>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                            <Typography.Text>20</Typography.Text>
                        </Col>
                       
                    </Row>
                </Col>
                <Col span={24} className="mt-5">
                    <Typography.Text className="text-base font-medium mb-3 mt-4">
                        Calculation:
                    </Typography.Text>
                    <Row gutter={[16, 8]}>
                        <Col span={24}>
                            <Typography.Text>Daily Salary = ₹ 30,000 ÷ {daysWorked} = </Typography.Text>
                            <Typography.Text strong> {daysWorked ? `₹${formatMoney(dailySalary)}` : "N/A"}</Typography.Text>
                        </Col>
                        <Col span={24}>
                            <Typography.Text>
                                Salary For 20 Days Worked = ₹ {daysWorked ? formatMoney(dailySalary) : 'N/A'} × 20 ={' '}
                            </Typography.Text>
                            <Typography.Text strong>₹ {daysWorked ? formatMoney(dailySalary * 20) : 'N/A'}</Typography.Text>
                        </Col>
                    </Row>
                </Col>
            </Card>
        </Row>
    );
};

export default CompanyWorkingDays;
