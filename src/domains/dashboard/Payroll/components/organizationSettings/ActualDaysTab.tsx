import React from 'react';


import { Row, Col, Typography, Card } from 'antd';

import { getWorkingDaysInMonth } from '@utils/calculateDate';

type Props = {
    data:any
};

const ActualDaysTab = (props: Props) => {

    const workingDays = getWorkingDaysInMonth(2025,1,props?.data?.selectWorkingDays|| [])

    

    // Calculate total number of working days in January 2025, given selectedWorking like: ["MON", "TUE", "WED", "THU", "FRI"]
    

    return (
    <Row gutter={[16, 16]}>
        <Col span={24}>
            <Typography.Text className="text-sm text-gray-700">
                When You Select <span className="text-base font-medium mb-3">&quot;Actual Days In A Month&quot;</span>,
                The Salary Is Calculated Based On The Total Calendar Days In The Month, Including
                Weekends And Public Holidays. The Daily Salary Varies Depending On The Number Of
                Days In The Month (E.g., 28, 30, Or 31 Days).
            </Typography.Text>
        </Col>
        <Card bordered={false} style={{ backgroundColor: 'white', borderRadius: '8px' }}>
            <Col span={24}>
                <Typography.Text className="text-base font-medium mb-3">
                    Example Calculation For January 2025:
                </Typography.Text>
                <Row gutter={[16, 10]}>
                    <Col span={12}>
                        <Typography.Text>Monthly Salary</Typography.Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                        <Typography.Text>₹ 30,000</Typography.Text>
                    </Col>
                    <Col span={12}>
                        <Typography.Text>Total Calendar Days</Typography.Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                        <Typography.Text>31</Typography.Text>
                    </Col>
                    <Col span={12}>
                        <Typography.Text>Days Worked By Employee</Typography.Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                        <Typography.Text>{workingDays}</Typography.Text>
                    </Col>
                </Row>
            </Col>

            <Col span={24} className="mt-3">
                <Typography.Text className="text-base font-medium mb-3">
                    Calculation:
                </Typography.Text>
                <Row gutter={[16, 8]}>
                    <Col>
                        <Typography.Text>Daily Salary = ₹ 30,000 ÷ {31} = {" "}</Typography.Text>
                        <Typography.Text strong>₹ {(30000/31).toLocaleString("en-IN",{minimumFractionDigits: 2,maximumFractionDigits: 2})}</Typography.Text>
                    </Col>
                    <Col span={24}>
                        <Typography.Text>
                            Salary For {workingDays} Days Worked = ₹ {(30000/31).toLocaleString("en-IN",{minimumFractionDigits: 2,maximumFractionDigits: 2})} × {workingDays} = {" "}
                        </Typography.Text>
                        <Typography.Text strong>₹ {(workingDays*(30000/31)).toLocaleString("en-IN",{minimumFractionDigits: 2,maximumFractionDigits: 2})}</Typography.Text>
                    </Col>
                </Row>
            </Col>
        </Card>
    </Row>
);}

export default ActualDaysTab;
