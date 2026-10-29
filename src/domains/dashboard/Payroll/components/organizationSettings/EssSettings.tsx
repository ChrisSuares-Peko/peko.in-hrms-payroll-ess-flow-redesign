import { ReactNode, useEffect, useState } from 'react';

import {
    CheckCircleOutlined,
    FileTextOutlined,
    IdcardOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Checkbox, Col, Flex, InputNumber, Row, Switch, TimePicker, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getCheckInOutStatus,
    getDefaultWorkSchedule,
    getEssAccess,
    getGracePeriod,
    getOnboardingDocuments,
    OnboardingDocument,
    updateCheckInOutStatus,
    updateDefaultWorkSchedule,
    updateEssAccess,
    updateGracePeriod,
    updateOnboardingDocuments,
} from '../../api/essSettings';

const FEATURES = [
    {
        icon: <FileTextOutlined />,
        label: 'View Payslips',
        description: 'Access monthly payslips and salary history anytime.',
    },
    {
        icon: <CheckCircleOutlined />,
        label: 'Apply for Leave',
        description: 'Submit leave requests and track approval status.',
    },
    {
        icon: <UserOutlined />,
        label: 'Update Personal Info',
        description: 'Edit contact details, emergency contacts & more.',
    },
    {
        icon: <IdcardOutlined />,
        label: 'View Attendance',
        description: 'Check attendance logs, overtime and work hours.',
    },
];

const IconBox = ({ icon }: { icon: ReactNode }) => (
    <Flex
        align="center"
        justify="center"
        style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#FFF0F0',
            color: '#ff4f4f',
            fontSize: 18,
            flexShrink: 0,
        }}
    >
        {icon}
    </Flex>
);

const EssSettings = () => {
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);

    const [activated, setActivated] = useState(false);
    const [accessLoading, setAccessLoading] = useState(true);
    const [savingAccess, setSavingAccess] = useState(false);

    const [documents, setDocuments] = useState<OnboardingDocument[]>([]);
    const [savingDocs, setSavingDocs] = useState(false);

    const [checkInOutEnabled, setCheckInOutEnabled] = useState(false);
    const [savingCheckInOut, setSavingCheckInOut] = useState(false);

    const [gracePeriodEnabled, setGracePeriodEnabled] = useState(false);
    const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(0);
    const [savingGrace, setSavingGrace] = useState(false);

    const [checkInTime, setCheckInTime] = useState('09:00');
    const [checkOutTime, setCheckOutTime] = useState('18:00');
    const [savingSchedule, setSavingSchedule] = useState(false);

    useEffect(() => {
        (async () => {
            setAccessLoading(true);
            const res = await getEssAccess();
            if (res) setActivated(!!res.essAccess);
            setAccessLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (!activated) return;
        (async () => {
            const [docsRes, graceRes, checkInOutRes, scheduleRes] = await Promise.all([
                getOnboardingDocuments({ userId: id, userType: role }),
                getGracePeriod({ userId: id, userType: role }),
                getCheckInOutStatus({ userId: id, userType: role }),
                getDefaultWorkSchedule({ userId: id, userType: role }),
            ]);
            if (docsRes) setDocuments(docsRes.onboardingDocuments);
            if (graceRes) {
                setGracePeriodMinutes(graceRes.gracePeriodMinutes);
                setGracePeriodEnabled(graceRes.gracePeriodMinutes > 0);
            }
            if (checkInOutRes) setCheckInOutEnabled(!!checkInOutRes.checkInOutEnabled);
            if (scheduleRes) {
                setCheckInTime(scheduleRes.defaultWorkSchedule.checkInTime);
                setCheckOutTime(scheduleRes.defaultWorkSchedule.checkOutTime);
            }
        })();
    }, [activated, id, role]);

    const handleToggleAccess = async (checked: boolean) => {
        setSavingAccess(true);
        const res = await updateEssAccess(checked);
        if (res) {
            setActivated(checked);
            dispatch(showToast({ variant: 'success', description: 'ESS access updated successfully' }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to update ESS access' }));
        }
        setSavingAccess(false);
    };

    const toggleDoc = (key: string) => {
        setDocuments(prev =>
            prev.map(doc => (doc.key === key ? { ...doc, required: !doc.required } : doc))
        );
    };

    const handleSaveDocs = async () => {
        setSavingDocs(true);
        const res = await updateOnboardingDocuments({
            userId: id,
            userType: role,
            onboardingDocuments: documents.map(doc => ({ key: doc.key, required: doc.required })),
        });
        if (res) {
            dispatch(showToast({ variant: 'success', description: 'Onboarding documents updated successfully' }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to update onboarding documents' }));
        }
        setSavingDocs(false);
    };

    const handleToggleCheckInOut = async (checked: boolean) => {
        setSavingCheckInOut(true);
        const res = await updateCheckInOutStatus({ userId: id, userType: role, checkInOutEnabled: checked });
        if (res) {
            setCheckInOutEnabled(checked);
            dispatch(showToast({ variant: 'success', description: 'Check-in/out setting updated successfully' }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to update check-in/out setting' }));
        }
        setSavingCheckInOut(false);
    };

    const handleSaveGrace = async () => {
        setSavingGrace(true);
        const minutes = gracePeriodEnabled ? gracePeriodMinutes : 0;
        const res = await updateGracePeriod({ userId: id, userType: role, gracePeriodMinutes: minutes });
        if (res) {
            dispatch(showToast({ variant: 'success', description: 'Grace period updated successfully' }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to update grace period' }));
        }
        setSavingGrace(false);
    };

    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
        const res = await updateDefaultWorkSchedule({ userId: id, userType: role, checkInTime, checkOutTime });
        if (res) {
            dispatch(showToast({ variant: 'success', description: 'Default work schedule updated successfully' }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to update default work schedule' }));
        }
        setSavingSchedule(false);
    };

    return (
        <Flex vertical gap={20} className="pt-6" style={{ maxWidth: 760 }}>
            <Card>
                <Flex justify="space-between" align="start">
                    <Flex vertical gap={4} style={{ maxWidth: 560 }}>
                        <Typography.Text className="text-base font-medium">
                            Employee Self-Service Portal
                        </Typography.Text>
                        <Typography.Text type="secondary" className="text-xs">
                            Enable your employees to manage their own HR tasks — view payslips,
                            apply for leave, update personal info, and more.
                        </Typography.Text>
                    </Flex>
                    <Flex align="center" gap={6} className="pt-1">
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: activated ? '#52c41a' : '#d9d9d9',
                            }}
                        />
                        <Typography.Text className="text-xs" style={{ color: activated ? '#52c41a' : undefined }}>
                            {activated ? 'Active' : 'Inactive'}
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Card>

            <Flex vertical gap={12}>
                <Typography.Text className="text-sm font-medium">What employees can do</Typography.Text>
                <Row gutter={[16, 16]}>
                    {FEATURES.map(feature => (
                        <Col xs={24} sm={12} key={feature.label}>
                            <Flex
                                gap={12}
                                align="start"
                                className="p-3 border border-borderGray rounded-lg h-full"
                            >
                                <IconBox icon={feature.icon} />
                                <Flex vertical gap={2}>
                                    <Typography.Text className="text-sm font-medium">
                                        {feature.label}
                                    </Typography.Text>
                                    <Typography.Text type="secondary" className="text-xs">
                                        {feature.description}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </Col>
                    ))}
                </Row>
            </Flex>

            <Card>
                <Flex justify="space-between" align="center">
                    <Flex vertical gap={4}>
                        <Typography.Text className="text-base font-medium">
                            Activate Employee Self-Service Portal
                        </Typography.Text>
                        <Typography.Text type="secondary" className="text-xs">
                            Once activated, employees will receive login access to their personal
                            HR portal.
                        </Typography.Text>
                    </Flex>
                    <Switch checked={activated} loading={accessLoading || savingAccess} onChange={handleToggleAccess} />
                </Flex>
            </Card>

            {activated && (
                <>
                    <Card>
                        <Flex vertical gap={4} className="mb-4">
                            <Typography.Text className="text-base font-medium">
                                Required Onboarding Documents
                            </Typography.Text>
                            <Typography.Text type="secondary" className="text-xs">
                                Check the documents employees must submit during onboarding. This
                                list appears on the employee&apos;s onboarding checklist.
                            </Typography.Text>
                        </Flex>
                        <Row gutter={[16, 12]}>
                            {documents.map(doc => (
                                <Col xs={24} sm={12} key={doc.key}>
                                    <Checkbox checked={doc.required} onChange={() => toggleDoc(doc.key)}>
                                        {doc.label}
                                    </Checkbox>
                                </Col>
                            ))}
                        </Row>
                        <Flex justify="end" className="mt-4">
                            <Button type="primary" danger loading={savingDocs} onClick={handleSaveDocs}>
                                Save
                            </Button>
                        </Flex>
                    </Card>

                    <Card>
                        <Flex vertical gap={4} className="mb-4">
                            <Typography.Text className="text-base font-medium">
                                Attendance Settings
                            </Typography.Text>
                            <Typography.Text type="secondary" className="text-xs">
                                Configure how employee attendance is tracked and managed in the
                                portal.
                            </Typography.Text>
                        </Flex>

                        <Flex justify="space-between" align="center" className="py-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-sm font-medium">
                                    Enable Employee Check In/Check Out
                                </Typography.Text>
                                <Typography.Text type="secondary" className="text-xs">
                                    Allow employee to mark their check in and check out from the
                                    Employee Portal.
                                </Typography.Text>
                            </Flex>
                            <Switch checked={checkInOutEnabled} loading={savingCheckInOut} onChange={handleToggleCheckInOut} />
                        </Flex>

                        <Flex justify="space-between" align="center" className="py-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-sm font-medium">
                                    Late Arrival Grace Period
                                </Typography.Text>
                                <Typography.Text type="secondary" className="text-xs">
                                    Time allowed after shift start before marking as late.
                                </Typography.Text>
                            </Flex>
                            <Switch checked={gracePeriodEnabled} onChange={setGracePeriodEnabled} />
                        </Flex>
                        {gracePeriodEnabled && (
                            <Flex vertical gap={16} className="pb-3">
                                <Flex vertical gap={4}>
                                    <Typography.Text className="text-xs">Grace period (minutes)</Typography.Text>
                                    <InputNumber
                                        min={0}
                                        max={1440}
                                        addonAfter="min"
                                        value={gracePeriodMinutes}
                                        onChange={value => setGracePeriodMinutes(Number(value) || 0)}
                                        style={{ width: 200 }}
                                    />
                                </Flex>
                                <Flex justify="end">
                                    <Button type="primary" danger loading={savingGrace} onClick={handleSaveGrace}>
                                        Save
                                    </Button>
                                </Flex>
                            </Flex>
                        )}

                        <Flex vertical gap={12} className="py-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-sm font-medium">
                                    Default Check In/Out Time
                                </Typography.Text>
                                <Typography.Text type="secondary" className="text-xs">
                                    Set the default shift start and end times for attendance
                                    tracking.
                                </Typography.Text>
                            </Flex>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Flex vertical gap={4}>
                                        <Typography.Text className="text-xs">Check-in time</Typography.Text>
                                        <TimePicker
                                            format="HH:mm"
                                            placeholder="09:00"
                                            value={checkInTime ? dayjs(checkInTime, 'HH:mm') : null}
                                            onChange={value => setCheckInTime(value ? value.format('HH:mm') : '')}
                                            style={{ width: '100%' }}
                                            allowClear={false}
                                        />
                                    </Flex>
                                </Col>
                                <Col span={12}>
                                    <Flex vertical gap={4}>
                                        <Typography.Text className="text-xs">Check-out time</Typography.Text>
                                        <TimePicker
                                            format="HH:mm"
                                            placeholder="18:00"
                                            value={checkOutTime ? dayjs(checkOutTime, 'HH:mm') : null}
                                            onChange={value => setCheckOutTime(value ? value.format('HH:mm') : '')}
                                            style={{ width: '100%' }}
                                            allowClear={false}
                                        />
                                    </Flex>
                                </Col>
                            </Row>
                            <Flex justify="end">
                                <Button type="primary" danger loading={savingSchedule} onClick={handleSaveSchedule}>
                                    Save
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>
                </>
            )}
        </Flex>
    );
};

export default EssSettings;
