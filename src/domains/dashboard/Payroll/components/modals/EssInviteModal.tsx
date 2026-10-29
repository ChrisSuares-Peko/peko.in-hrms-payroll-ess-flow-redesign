import React, { useEffect, useState } from 'react';

import { CloseOutlined, EditOutlined, MailOutlined } from '@ant-design/icons';
import { Input, Modal, Flex, Form, Typography, Button, theme } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { getEmployee } from '../../api/employeeApi';
import { useSendEssInvite } from '../../hooks/employeeHooks/useSendEssInvite';
import { useUpdateEmployeeApiNew } from '../../hooks/employeeHooks/useUpdateEmployeeApiNew';
import { EmployeeProfile } from '../../types/employeeprofile/type';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

type Props = {
    open: boolean;
    onClose: () => void;
    name: string;
    email: string;
    mobileNo?: string;
    employeeId?: string;
    onSuccess?: () => void;
    loading?: boolean;
    // Existing work email on the employee — prefilled into the input on open.
    initialOfficialEmail?: string;
};

const EssInviteModal = ({
    open,
    onClose,
    name,
    email,
    mobileNo,
    employeeId,
    onSuccess,
    loading,
    initialOfficialEmail,
}: Props) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const { sendInvite, isSending, updateEmail, isUpdatingEmail } = useSendEssInvite();
    const { updateWorkEmail } = useUpdateEmployeeApiNew();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [officialEmail, setOfficialEmail] = useState('');
    const [originalEmail, setOriginalEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [fetchingEmail, setFetchingEmail] = useState(false);
    // Locked when a work email already exists on the employee — prefilled
    // and read-only unless the admin explicitly opts into editing it.
    const [emailLocked, setEmailLocked] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        setEmailError('');
        setIsEditing(false);
        setOfficialEmail(initialOfficialEmail ?? '');
        setOriginalEmail(initialOfficialEmail ?? '');
        setEmailLocked(Boolean(initialOfficialEmail));

        // When no email was passed in but we have an employee id, fetch the
        // employee record and populate the work email from it.
        if (initialOfficialEmail || !employeeId) return undefined;

        let active = true;
        setFetchingEmail(true);
        getEmployee({ userId: id, userType: role, employeeID: employeeId })
            .then(data => {
                if (active && data) {
                    const existingEmail =
                        (data as unknown as EmployeeProfile).employeeInformation?.workEmailId ?? '';
                    setOfficialEmail(existingEmail);
                    setOriginalEmail(existingEmail);
                    setEmailLocked(Boolean(existingEmail));
                }
            })
            .finally(() => {
                if (active) setFetchingEmail(false);
            });
        return () => {
            active = false;
        };
    }, [open, initialOfficialEmail, employeeId, id, role]);

    const handleEmailChange = (value: string) => {
        setOfficialEmail(value);
        if (value && /^\s/.test(value)) {
            setEmailError('Work email cannot start with a blank space.');
        } else if (value && /\s$/.test(value)) {
            setEmailError('Work email cannot end with a blank space.');
        } else if (value && !EMAIL_REGEX.test(value.trim())) {
            setEmailError('Please enter a valid email address.');
        } else if (value && value === email) {
            setEmailError('Work email cannot be the same as personal email.');
        } else {
            setEmailError('');
        }
    };

    const busy = (loading ?? isSending) || fetchingEmail || savingEmail || isUpdatingEmail;
    const isChangingEmail = emailLocked && isEditing;

    const toggleEditing = () => {
        if (isEditing) {
            // Cancel: revert to the email currently on record.
            setOfficialEmail(originalEmail);
            setEmailError('');
        }
        setIsEditing(prev => !prev);
    };

    const handleSend = async () => {
        if (isChangingEmail) {
            if (!employeeId || officialEmail === originalEmail) return;
            const ok = await updateEmail({ employeeId, email: officialEmail });
            if (ok) {
                onSuccess?.();
                onClose();
            }
            return;
        }

        // Backfill the employee's work email first when they don't already have one,
        // so it's saved on their record even though the ESS user is created separately.
        if (!emailLocked && employeeId) {
            setSavingEmail(true);
            const updated = await updateWorkEmail({ id: employeeId, workEmailId: officialEmail });
            setSavingEmail(false);
            if (!updated) return;
        }

        const ok = await sendInvite({ name, email: officialEmail, mobileNo, employeeId });
        if (ok) {
            onSuccess?.();
            onClose();
        }
    };

    return (
        <Modal open={open} onCancel={onClose} footer={null} centered width={480}>
            <Flex vertical align="center" gap={12} className="pt-4 pb-2">
                <Flex
                    justify="center"
                    align="center"
                    className="rounded-full"
                    style={{
                        width: 72,
                        height: 72,
                        backgroundColor: '#FFF0F0',
                    }}
                >
                    <MailOutlined style={{ fontSize: 30, color: colorPrimary }} />
                </Flex>

                <Typography.Text className="text-lg font-bold text-center">
                    Send ESS Onboarding Invite
                </Typography.Text>

                <Typography.Text
                    type="secondary"
                    className="text-center"
                    style={{ fontSize: 13, maxWidth: 360 }}
                >
                    An ESS invite will be sent to <strong>{name}</strong> to set up their employee
                    self-service account.
                </Typography.Text>
            </Flex>

            <Flex vertical gap={12} className="px-1 py-4">
                <Flex vertical gap={4}>
                    <Form.Item
                        layout="vertical"
                        label={
                            <Typography.Text className="text-[13px] font-medium text-[#3b3b3b]">
                                Work Email
                            </Typography.Text>
                        }
                        required
                        colon={false}
                        style={{ marginBottom: 0 }}
                    >
                        <Input
                            value={officialEmail}
                            onChange={e => handleEmailChange(e.target.value)}
                            placeholder="Enter employee's work email"
                            prefix={<MailOutlined className="text-gray-400" />}
                            suffix={
                                emailLocked ? (
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={isEditing ? <CloseOutlined /> : <EditOutlined />}
                                        disabled={busy}
                                        onClick={toggleEditing}
                                    />
                                ) : undefined
                            }
                            status={emailError ? 'error' : ''}
                            style={{ borderRadius: 8 }}
                            disabled={busy || (emailLocked && !isEditing)}
                        />
                    </Form.Item>
                    {emailError && (
                        <Typography.Text className="text-[14px]" style={{ color: '#ff4d4f' }}>
                            {emailError}
                        </Typography.Text>
                    )}
                </Flex>
            </Flex>

            <Flex justify="center" gap={12} className="pt-4">
                <Button onClick={onClose} disabled={busy} style={{ borderRadius: 8 }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSend}
                    loading={busy}
                    disabled={
                        !officialEmail.trim() ||
                        !!emailError ||
                        (isChangingEmail && officialEmail === originalEmail)
                    }
                    style={{
                        backgroundColor: colorPrimary,
                        color: 'white',
                        borderRadius: 8,
                    }}
                >
                    {isChangingEmail ? 'Update Email' : 'Send Invite'}
                </Button>
            </Flex>
        </Modal>
    );
};

export default EssInviteModal;
