import { useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Flex, Input, Modal, Select, Typography } from 'antd';
import dayjs from 'dayjs';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { useProbationActionsApi } from '../../hooks/employeeHooks/useProbationActionsApi';
import { EmployeeProfile } from '../../types/employeeprofile/type';
import OffBoardEmployeeModal from '../modals/OffBoardEmployeeModal';

const EXTEND_MONTH_OPTIONS = [1, 2, 3, 4, 5, 6].map(months => ({
    value: months,
    label: `${months} ${months === 1 ? 'month' : 'months'}`,
}));

type Props = {
    employee: EmployeeProfile;
    /** Called after confirming, extending or offboarding, to reload the profile. */
    onChanged: () => void;
};

// The header's "Probation" button while the employee is on probation or waiting for review:
// Confirm employee, Extend probation (with a reason) or Do not confirm (the offboarding flow).
const ProbationActions = ({ employee, onChanged }: Props) => {
    const { confirm, extend, isSaving } = useProbationActionsApi();
    const [action, setAction] = useState<'confirm' | 'extend' | 'offboard' | null>(null);
    const [months, setMonths] = useState(3);
    const [reason, setReason] = useState('');

    const stage = employee.employmentStage;
    if (!stage || !['ON_PROBATION', 'PROBATION_REVIEW_DUE'].includes(stage.stage)) return null;

    const name = employee.personalInformation.fullName;
    const endDate = dayjs(stage.probationEndDate);
    const ended = stage.stage === 'PROBATION_REVIEW_DUE';
    const close = () => {
        setAction(null);
        setReason('');
        setMonths(3);
    };
    const done = (ok: boolean) => {
        if (!ok) return;
        close();
        onChanged();
    };

    return (
        <>
            <Dropdown
                trigger={['click']}
                menu={{
                    items: [
                        { key: 'confirm', label: 'Confirm employee' },
                        { key: 'extend', label: 'Extend probation' },
                        { key: 'offboard', label: 'Do not confirm', danger: true },
                    ],
                    onClick: ({ key }) => setAction(key as 'confirm' | 'extend' | 'offboard'),
                }}
            >
                <Button style={{ borderRadius: '8px', fontWeight: 500 }}>
                    Probation <DownOutlined />
                </Button>
            </Dropdown>

            <ConfirmationModal
                isOpen={action === 'confirm'}
                handleCancel={close}
                title={`Confirm ${name}?`}
                description={`Probation ${ended ? 'ended' : 'ends'} on ${endDate.format('D MMM YYYY')}. ${name} will show as Confirmed from ${
                    ended ? endDate.format('D MMM YYYY') : 'today'
                }.`}
                handleSubmit={async () => done(await confirm(employee.id))}
                isLoading={isSaving}
            />

            <Modal
                open={action === 'extend'}
                title={`Extend probation for ${name}`}
                onCancel={close}
                width={420}
                centered
                okText="Extend"
                okButtonProps={{ danger: true, disabled: !reason.trim(), loading: isSaving }}
                onOk={async () => done(await extend(employee.id, months, reason.trim()))}
            >
                <Flex vertical gap={12} data-testid="extend-probation-body">
                    <Typography.Text>
                        Currently {ended ? 'ended' : 'ends'} on {endDate.format('D MMM YYYY')}.
                    </Typography.Text>
                    <Select value={months} options={EXTEND_MONTH_OPTIONS} onChange={setMonths} />
                    <Typography.Text strong>
                        New end date: {endDate.add(months, 'month').format('D MMM YYYY')}
                    </Typography.Text>
                    <Input.TextArea
                        rows={2}
                        maxLength={200}
                        placeholder="Reason (required) — e.g. needs more time on deliverables"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </Flex>
            </Modal>

            {action === 'offboard' && (
                <OffBoardEmployeeModal
                    open
                    handleCancel={close}
                    employeeData={employee}
                    setOffboardReload={(() => done(true)) as React.Dispatch<React.SetStateAction<boolean | number>>}
                />
            )}
        </>
    );
};

export default ProbationActions;
