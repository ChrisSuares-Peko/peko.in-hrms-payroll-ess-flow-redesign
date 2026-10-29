import React, { useState } from 'react';

import { Button, Drawer, Flex, Form, InputNumber, Radio, Select, Typography } from 'antd';

import useGeneralApi from '@src/domains/dashboard/profile/hooks/useGeneralApi';

import { LwfConfig } from '../../../hooks/employeeProfileHooks/useEmployeeStatutoryDetails';

const { Text } = Typography;

const SCHEDULE_OPTIONS = [
    { label: "Use work state's default schedule", value: '' },
    { label: 'Monthly — every payroll', value: 'MONTHLY' },
    { label: 'Half-yearly — June & December payrolls', value: 'JUNE_DECEMBER' },
    { label: 'Annual — December payroll only', value: 'DECEMBER_ONLY' },
];

// Provisional, same "needs reconciliation with the compliance partner" caveat as the
// backend's lwfStateSchedule.js — shown only as an informational reference while editing
// an employee's LWF config. Never used in the actual calculation, which always relies on
// the employee's own share type/value below (or the org's flat default when unset).
const STATE_LWF_REFERENCE: Record<
    string,
    { employeeAmount: number; employerAmount: number; schedule: string; remitBy: string }
> = {
    Maharashtra: { employeeAmount: 25, employerAmount: 75, schedule: 'JUNE_DECEMBER', remitBy: '15 July / 15 January' },
    Karnataka: { employeeAmount: 20, employerAmount: 40, schedule: 'DECEMBER_ONLY', remitBy: '15 January' },
    Telangana: { employeeAmount: 2, employerAmount: 5, schedule: 'DECEMBER_ONLY', remitBy: '15 January' },
    Kerala: { employeeAmount: 20, employerAmount: 20, schedule: 'MONTHLY', remitBy: '5th of the following month' },
    Punjab: { employeeAmount: 5, employerAmount: 20, schedule: 'MONTHLY', remitBy: '5th of the following month' },
    Chandigarh: { employeeAmount: 5, employerAmount: 20, schedule: 'MONTHLY', remitBy: '5th of the following month' },
    Haryana: { employeeAmount: 31, employerAmount: 62, schedule: 'MONTHLY', remitBy: '5th of the following month' },
};

const SCHEDULE_SUMMARY_LABEL: Record<string, string> = {
    MONTHLY: 'monthly',
    JUNE_DECEMBER: 'June & December',
    DECEMBER_ONLY: 'December only',
};

interface UpdateLwfAmountModalProps {
    open: boolean;
    employeeName: string;
    initialConfig: LwfConfig;
    isLoading?: boolean;
    onCancel: () => void;
    onSave: (config: LwfConfig) => Promise<any>;
}

const UpdateLwfAmountModal = ({
    open,
    employeeName,
    initialConfig,
    isLoading = false,
    onCancel,
    onSave,
}: UpdateLwfAmountModalProps) => {
    // Same source as the Compliance Settings tab's "Org Work State" field, so this offers
    // the identical full India states list rather than a hand-picked subset — the
    // schedule/amount auto-fill below (STATE_LWF_REFERENCE) still only fires for the
    // handful of states with known official schedules; any other state just skips it.
    const { statesList } = useGeneralApi();
    const workStateOptions = [...(statesList || [])].sort((a, b) => a.label.localeCompare(b.label));

    // Flat/Percent are the only two contribution shapes in this redesign — normalize a
    // never-configured null straight to FLAT so Save always persists an explicit choice.
    const [config, setConfig] = useState<LwfConfig>(() => ({
        ...initialConfig,
        employeeShareType: initialConfig.employeeShareType || 'FLAT',
        employerShareType: initialConfig.employerShareType || 'FLAT',
    }));

    const set = <K extends keyof LwfConfig>(key: K, value: LwfConfig[K]) => setConfig(prev => ({ ...prev, [key]: value }));

    const handleStateChange = (value: string | null) => {
        const reference = value ? STATE_LWF_REFERENCE[value] : undefined;
        setConfig(prev => ({
            ...prev,
            workState: value,
            ...(reference
                ? {
                      employeeShareType: 'FLAT',
                      employeeShareValue: reference.employeeAmount,
                      employerShareType: 'FLAT',
                      employerShareValue: reference.employerAmount,
                  }
                : {}),
        }));
    };

    const handleSave = async () => {
        const result = await onSave(config);
        if (result) onCancel();
    };

    const reference = config.workState ? STATE_LWF_REFERENCE[config.workState] : undefined;

    return (
        <Drawer
            title="Update Labour Welfare Fund"
            open={open}
            onClose={onCancel}
            width={480}
            styles={{ body: { paddingInline: 20, paddingBlock: 16 }, header: { paddingInline: 20 } }}
            footer={
                <Flex justify="end" gap={10}>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button type="primary" danger loading={isLoading} onClick={handleSave}>
                        Save
                    </Button>
                </Flex>
            }
        >
            <Form layout="vertical">
                <Text type="secondary" className="block mb-4">
                    LWF follows the state where {employeeName} works — not their home address. Picking a state fills
                    in its official schedule and amounts; adjust them below if your registration differs.
                </Text>

                <Form.Item label="Work State" extra="The org work state (HR Settings → Compliance Settings).">
                    <Select
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        placeholder="Select work state"
                        className="w-full"
                        options={workStateOptions}
                        value={config.workState || undefined}
                        onChange={value => handleStateChange(value ?? null)}
                    />
                </Form.Item>

                <Form.Item
                    label="Deduction Schedule"
                    extra="LWF runs on the calendar year — the statutory dates are 30 June and 31 December, which is why annual states deduct with December."
                >
                    <Select
                        className="w-full"
                        options={SCHEDULE_OPTIONS}
                        value={config.scheduleOverride || ''}
                        onChange={value => set('scheduleOverride', value || null)}
                    />
                </Form.Item>

                <Form.Item
                    label="Employee Contribution (per deduction)"
                    extra="Deducted from salary in each deduction month."
                >
                    <Flex vertical gap={8}>
                        <Radio.Group
                            value={config.employeeShareType || 'FLAT'}
                            onChange={e => set('employeeShareType', e.target.value)}
                        >
                            <Radio value="FLAT">Flat amount (₹)</Radio>
                            <Radio value="PERCENT_OF_GROSS">% of Gross</Radio>
                        </Radio.Group>
                        <InputNumber
                            className="w-full"
                            min={0}
                            max={config.employeeShareType === 'PERCENT_OF_GROSS' ? 100 : 1500}
                            step={config.employeeShareType === 'PERCENT_OF_GROSS' ? 0.1 : 1}
                            addonAfter={config.employeeShareType === 'PERCENT_OF_GROSS' ? '%' : '₹'}
                            value={config.employeeShareValue}
                            onChange={value => set('employeeShareValue', value)}
                        />
                    </Flex>
                </Form.Item>

                <Form.Item
                    label="Employer Contribution (per deduction)"
                    extra="Paid by the company on top — never deducted from salary, never part of CTC."
                >
                    <Flex vertical gap={8}>
                        <Radio.Group
                            value={config.employerShareType || 'FLAT'}
                            onChange={e => set('employerShareType', e.target.value)}
                        >
                            <Radio value="FLAT">Flat amount (₹)</Radio>
                            <Radio value="PERCENT_OF_GROSS">% of Gross</Radio>
                        </Radio.Group>
                        <InputNumber
                            className="w-full"
                            min={0}
                            max={config.employerShareType === 'PERCENT_OF_GROSS' ? 100 : 1500}
                            step={config.employerShareType === 'PERCENT_OF_GROSS' ? 0.1 : 1}
                            addonAfter={config.employerShareType === 'PERCENT_OF_GROSS' ? '%' : '₹'}
                            value={config.employerShareValue}
                            onChange={value => set('employerShareValue', value)}
                        />
                    </Flex>
                </Form.Item>

                {reference && (
                    <Text type="secondary" className="text-xs">
                        {config.workState}&apos;s official schedule: ₹{reference.employeeAmount} employee · ₹
                        {reference.employerAmount} employer, {SCHEDULE_SUMMARY_LABEL[reference.schedule]}. Remit by{' '}
                        {reference.remitBy}.
                    </Text>
                )}
            </Form>
        </Drawer>
    );
};

export default UpdateLwfAmountModal;
