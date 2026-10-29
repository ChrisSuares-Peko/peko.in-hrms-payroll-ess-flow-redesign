import React, { useState } from 'react';

import { Alert, Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import DeductionCompTable from '../organizationSettings/DeductionComponents/DeductionCompTable';
import SalaryCompTable from '../organizationSettings/SalaryComponents/SalaryCompTable';

interface Props {
    setActiveTabKey: (key: any) => void;
}

const WelcomeSalaryComponents: React.FC<Props> = ({ setActiveTabKey }) => {
    const dispatch = useAppDispatch();
    const [hasBalancingComponent, setHasBalancingComponent] = useState(false);

    const handleNext = () => {
        if (!hasBalancingComponent) {
            dispatch(
                showToast({
                    description:
                        'Add a Balancing component (e.g. Special Allowances) before continuing — it absorbs whatever remains of Gross after the other components.',
                    variant: 'error',
                })
            );
            return;
        }
        setActiveTabKey(3);
    };

    return (
        <Content>
            <Row>
                <Col span={24} className="mb-5 mt-5">
                    <Alert
                        type="info"
                        showIcon
                        message="Let's set up your salary components here."
                        description="Earnings such as Basic Salary, HRA, and allowances contribute to gross salary, while deductions such as canteen, transport, or insurance charges reduce take-home pay without affecting CTC. Do not add statutory components such as EPF, ESI, Professional Tax or LWF here. These are managed separately from the employee's profile based on their salary and applicable compliance rules."
                    />
                </Col>
                <Col
                    xs={24}
                    className="mb-6 xs:p-4 md:p-8 border rounded-2xl border-[#EAEAEA]"
                >
                    <SalaryCompTable onHasBalancingComponentChange={setHasBalancingComponent} />
                </Col>
                <Col xs={24} className="xs:p-4 md:p-8 border rounded-2xl border-[#EAEAEA]">
                    <DeductionCompTable />
                </Col>
            </Row>
            <Flex justify="space-between" align="center" gap={10} className="w-full mt-6">
                <Button onClick={() => setActiveTabKey(1)} className="px-8">
                    <Typography.Text className="text-textRed">Back</Typography.Text>
                </Button>
                <Button className="px-12" type="primary" danger onClick={handleNext}>
                    Next
                </Button>
            </Flex>
        </Content>
    );
};

export default WelcomeSalaryComponents;
