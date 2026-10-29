import { useEffect } from 'react';

import { Button, Form, Input, Modal, Select, Tooltip, Typography } from 'antd';


import { CardMemberEdit } from '../../../api/user/cardMembersApi';
import { useRoleCatalogue } from '../../../hooks/admin/useRoleCatalogue';
import { useUpdateMemberRole } from '../../../hooks/admin/useUpdateMemberRole';
import { ADMIN_ROLE } from '../../../utils/cardRoles';
import { PEOPLE_COPY } from '../../../utils/peopleData';
import { Member } from '../../../utils/types';
import { MODAL_CLOSE_ICON, ROUNDED_MODAL_CLASSNAMES } from '../../common/modalProps';

const { Text } = Typography;

interface EditMemberModalProps {
    open: boolean;
    member: Member | null;
    onClose: () => void;
    onSuccess?: () => void;
}

interface EditMemberForm {
    name: string;
    mobileNo: string;
    role: string;
}

/**
 * Name and mobile are the identity Pine Labs verifies. Once KYC has completed they describe a verified person
 * holding a live card, so changing them here would leave our record disagreeing with the issuer's. The fields
 * stay visible — an admin should be able to see what was verified — but locked.
 */
const KYC_LOCKS_IDENTITY: Member['kycStatus'][] = ['Completed'];

const wsRules = (label: string) => [
    {
        validator: (_: unknown, value: string) => {
            if (!value) return Promise.resolve();
            if (/^\s|\s$/.test(value))
                return Promise.reject(new Error(`${label} cannot start or end with a space`));
            if (/\s{2,}/.test(value))
                return Promise.reject(new Error(`${label} cannot contain consecutive spaces`));
            return Promise.resolve();
        },
    },
];

/**
 * "Edit member" — the details an admin may change after an invite has gone out.
 *
 * Email is shown but never editable: a sub-user's email is their LOGIN username, and this endpoint writes only
 * the member row, never the credential. Offering it would change the address on screen while the account still
 * signed in with the old one.
 *
 * Team, team lead and department are absent because nothing stores them — offering them would accept input and
 * silently discard it.
 */
const EditMemberModal = ({ open, member, onClose, onSuccess }: EditMemberModalProps) => {
    const [form] = Form.useForm<EditMemberForm>();
    const { roles, isLoading: isLoadingRoles } = useRoleCatalogue();
    const { submitRole, isLoading } = useUpdateMemberRole();

    const identityLocked = !!member && KYC_LOCKS_IDENTITY.includes(member.kycStatus);
    const isOwner = !!member?.isAccountOwner;

    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                name: member?.name ?? '',
                mobileNo: member?.mobileNo ?? '',
                role: member?.role ?? undefined,
            });
        }
    }, [open, member, form]);

    const handleFinish = async (values: EditMemberForm) => {
        if (!member?.key) return;

        const changes: CardMemberEdit = {};
        if (!isOwner && values.role !== member.role) changes.role = values.role;
        if (!identityLocked) {
            const name = values.name?.trim();
            const mobileNo = values.mobileNo?.trim();
            if (name && name !== member.name) changes.name = name;
            if (mobileNo && mobileNo !== member.mobileNo) changes.mobileNo = mobileNo;
        }

        const saved = await submitRole(Number(member.key), changes);
        if (saved) {
            onSuccess?.();
            onClose();
        }
    };

    const lockedNote = (label: string) =>
        identityLocked
            ? `${label} cannot be changed once KYC is complete — it is the identity verified with the issuer.`
            : '';

    const detailMessage = () => {
        if (isOwner && identityLocked) {
            return 'You have completed KYC, so these details are now fixed.';
        }
        if (isOwner) {
            return 'Update your own details. The account owner is always an Admin.';
        }
        if (identityLocked) {
            return 'This member has completed KYC, so only their role can be changed.';
        }
        return 'Update this member’s details or change what they can do.';
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            destroyOnHidden
            centered
            classNames={ROUNDED_MODAL_CLASSNAMES}
            closeIcon={MODAL_CLOSE_ICON}
            width={560}
            title={`Edit ${member?.name ?? 'member'}`}
            footer={
                <div className="flex justify-end gap-3">
                    <Button danger onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="primary" loading={isLoading} onClick={() => form.submit()}>
                        Save changes
                    </Button>
                </div>
            }
        >
            <Text className="mb-5 block text-sm text-textBody">{detailMessage()}</Text>

            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Tooltip title={lockedNote('Name')}>
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[
                            { required: true, message: 'Please enter the name' },
                            { max: 50, message: 'Name cannot exceed 50 characters' },
                            ...wsRules('Name'),
                        ]}
                    >
                        <Input placeholder="Enter the name" disabled={identityLocked} />
                    </Form.Item>
                </Tooltip>

                <Tooltip title={lockedNote('Mobile number')}>
                    <Form.Item
                        name="mobileNo"
                        label="Mobile number"
                        rules={[
                            { required: true, message: 'Please enter the mobile number' },
                            { pattern: /^[0-9]{10}$/, message: 'Mobile number must be 10 digits' },
                        ]}
                    >
                        <Input
                            placeholder="Enter the mobile number"
                            maxLength={10}
                            disabled={identityLocked}
                        />
                    </Form.Item>
                </Tooltip>

                <Form.Item label="Email">
                    <Input value={member?.email ?? ''} disabled />
                    <Text className="mt-1 block text-xs text-textGreyLight">
                        Email is the member’s sign-in address and cannot be changed here.
                    </Text>
                </Form.Item>

                {isOwner ? (
                    <Form.Item label="Role">
                        <Input value={ADMIN_ROLE} disabled />
                        <Text className="mt-1 block text-xs text-textGreyLight">
                            The account owner is always an Admin.
                        </Text>
                    </Form.Item>
                ) : (
                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Please select a role' }]}
                    >
                        <Select
                            placeholder="Select a role"
                            loading={isLoadingRoles}
                            options={roles.map(role => ({
                                label: role.roleName,
                                value: role.roleName,
                                description: role.description,
                            }))}
                            optionRender={option => (
                                <div>
                                    <Text className="block text-sm text-textHeadings">
                                        {option.data.label}
                                    </Text>
                                    {option.data.description && (
                                        <Text className="block text-xs text-textGreyLight">
                                            {option.data.description}
                                        </Text>
                                    )}
                                </div>
                            )}
                        />
                    </Form.Item>
                )}
            </Form>

            <Text className="block text-xs text-textGreyLight">{PEOPLE_COPY.rolesNote}</Text>
        </Modal>
    );
};

export default EditMemberModal;
