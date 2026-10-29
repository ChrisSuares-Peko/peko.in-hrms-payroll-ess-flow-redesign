import { useRef } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Typography } from 'antd';

import UpdateEmployeeForm from './UpdateEmployeeForm';
import { UpdateEmployeeFormHandle, UpdateEmployeeFormValues } from './UpdateEmployeeForm.types';
import { useUpdateSalaryRolloutEmployee } from '../../hooks/employeeSalaryHooks/salaryRolloutHooks/useUpdateSalaryRolloutEmployee';
import { SalaryEmployee } from '../../utils/salaryEmployeesColumns/activeEmployees';

const { Text } = Typography;

interface UpdateEmployeeDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employee?: SalaryEmployee | null;
}

const UpdateEmployeeDrawer = ({ open, onClose, onSuccess, employee }: UpdateEmployeeDrawerProps) => {
    const formRef = useRef<UpdateEmployeeFormHandle>(null);
    const { update, isSubmitting } = useUpdateSalaryRolloutEmployee(() => {
        onSuccess();
        onClose();
    });

    if (!employee) return null;

    const isLocked = employee.bankAccountStatus === 'Approved' && employee.beneficiaryStatus === 'Added';

    const handleSave = (values: UpdateEmployeeFormValues) => {
        update(employee.key, values);
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="right"
            width={600}
            closable={false}
            styles={{
                body: { padding: 0 },
                header: { display: 'none' },
            }}
        >
            <Flex vertical style={{ height: '100%' }}>
                {/* Header */}
                <Flex
                    justify="space-between"
                    align="center"
                    style={{ padding: '28px 32px', borderBottom: '1px solid #F1F5F9' }}
                >
                    <Text style={{ fontSize: 20, fontWeight: 600, color: '#1E293B' }}>
                        Update Employee
                    </Text>
                    <Button
                        type="text"
                        icon={<CloseOutlined style={{ fontSize: 16, color: '#334155' }} />}
                        onClick={onClose}
                        style={{ width: 32, height: 32, padding: 0 }}
                    />
                </Flex>

                {/* Scrollable body */}
                <Flex vertical gap={28} style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
                    {/* Employee card */}
                    <Flex
                        align="center"
                        gap={14}
                        style={{
                            border: '1px solid #E4E4E7',
                            borderRadius: 16,
                            padding: '16px 20px',
                        }}
                    >
                        <Flex
                            align="center"
                            justify="center"
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: employee.avatarBg,
                                flexShrink: 0,
                            }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: 600, color: '#FF9F9F' }}>
                                {employee.initials}
                            </Text>
                        </Flex>
                        <Flex vertical gap={2}>
                            <Text style={{ fontSize: 15, fontWeight: 600, color: '#101828' }}>
                                {employee.name}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#6B788E' }}>
                                {employee.email}
                            </Text>
                        </Flex>
                    </Flex>

                    <UpdateEmployeeForm ref={formRef} employee={employee} onSave={handleSave} isLocked={isLocked} />
                </Flex>

                {/* Footer */}
                <Flex
                    justify="flex-end"
                    gap={12}
                    style={{
                        padding: '20px 32px',
                        borderTop: '1px solid #F1F5F9',
                    }}
                >
                    <Button
                        style={{
                            height: 44,
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                        }}
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        danger
                        loading={isSubmitting}
                        onClick={() => formRef.current?.submit()}
                        style={{
                            height: 44,
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            background: '#FF4F4F',
                            borderColor: '#FF4F4F',
                        }}
                    >
                        Save change
                    </Button>
                </Flex>
            </Flex>
        </Drawer>
    );
};

export default UpdateEmployeeDrawer;
