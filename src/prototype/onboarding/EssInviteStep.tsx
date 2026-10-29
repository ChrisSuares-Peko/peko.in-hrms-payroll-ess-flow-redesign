// PROTOTYPE-SETUP: hosts the existing EssInviteModal as a standalone onboarding step. In the app it opens
// from NewHireProfile / EmployeeDetailsHeader ("Share ESS Invite"); here it is prefilled with DEMO_EMPLOYEE.
import { useState } from 'react';

import { Button, Card, Flex, Typography } from 'antd';

import EssInviteModal from '@src/domains/dashboard/Payroll/components/modals/EssInviteModal';

import { DEMO_EMPLOYEE } from '../demoEmployee';

const EssInviteStep = () => {
    const [open, setOpen] = useState(true);

    return (
        <Card>
            <Flex vertical gap={12} align="flex-start">
                <Typography.Text>
                    Share Employee Self-Service access with{' '}
                    <Typography.Text strong>{DEMO_EMPLOYEE.name}</Typography.Text> (
                    {DEMO_EMPLOYEE.designation}, {DEMO_EMPLOYEE.department.departmentName}).
                </Typography.Text>
                <Button type="primary" onClick={() => setOpen(true)}>
                    Share ESS Invite
                </Button>
            </Flex>
            <EssInviteModal
                open={open}
                onClose={() => setOpen(false)}
                name={DEMO_EMPLOYEE.name}
                email={DEMO_EMPLOYEE.email}
                mobileNo={DEMO_EMPLOYEE.mobileNo}
                employeeId={String(DEMO_EMPLOYEE.id)}
                onSuccess={() => setOpen(false)}
            />
        </Card>
    );
};

export default EssInviteStep;
