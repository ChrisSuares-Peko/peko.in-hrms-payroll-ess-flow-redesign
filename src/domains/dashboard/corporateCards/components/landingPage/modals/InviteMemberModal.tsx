import { Button, Form, Input, Modal, Select, Typography } from 'antd';

import { useRoleCatalogue } from '../../../hooks/admin/useRoleCatalogue';
import { useInviteMemberApi } from '../../../hooks/user/useInviteMemberApi';
import {
    DEFAULT_MEMBER_DEPARTMENT,
    DEFAULT_MEMBER_ROLE,
    PEOPLE_COPY,
} from '../../../utils/peopleData';
import { MODAL_CLOSE_ICON, ROUNDED_MODAL_CLASSNAMES } from '../../common/modalProps';

const { Title, Text } = Typography;

const wsRules = (label: string) => [
    {
        validator: (_: unknown, value: string) => {
            if (!value) return Promise.resolve();
            if (/^\s/.test(value))
                return Promise.reject(new Error(`${label} cannot start with a space`));
            if (/\s$/.test(value))
                return Promise.reject(new Error(`${label} cannot end with a space`));
            if (/\s{2,}/.test(value))
                return Promise.reject(new Error(`${label} cannot contain consecutive spaces`));
            if (/^\s*$/.test(value))
                return Promise.reject(new Error(`${label} cannot be only spaces`));
            return Promise.resolve();
        },
    },
];

interface InviteMemberModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface InviteMemberForm {
    firstName: string;
    lastName: string;
    mobileNo: string;
    email: string;
    department?: string;
    role: string;
}

/** "Invite a new member" — single-step: capture member details, then validate + create in one action. */
const InviteMemberModal = ({ open, onClose, onSuccess }: InviteMemberModalProps) => {
    const [form] = Form.useForm<InviteMemberForm>();
    const { isLoading, submitInvite } = useInviteMemberApi();
    const { roles, isLoading: isLoadingRoles } = useRoleCatalogue();

    const roleOptions = roles.map(role => ({
        label: role.roleName,
        value: role.roleName,
        description: role.description,
    }));

    const handleClose = () => {
        form.resetFields();
        onClose();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const ok = await submitInvite(values);
            if (ok) {
                onSuccess?.();
                handleClose();
            }
            // eslint-disable-next-line no-empty
        } catch {}
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            destroyOnHidden
            centered
            classNames={ROUNDED_MODAL_CLASSNAMES}
            closeIcon={MODAL_CLOSE_ICON}
            width={600}
            title={
                <div className="flex flex-col gap-1.5 pr-6">
                    <Title level={3} className="!mb-0 !text-textHeadings">
                        Invite a new member
                    </Title>
                    <Text className="text-sm font-normal text-textBody">
                        They&apos;ll get an email to sign up and complete KYC.
                    </Text>
                </div>
            }
            footer={
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button
                        danger
                        size="large"
                        className="w-full"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        className="w-full"
                        loading={isLoading}
                        onClick={handleSubmit}
                    >
                        Send invite
                    </Button>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                className="mt-2"
                initialValues={{
                    department: DEFAULT_MEMBER_DEPARTMENT,
                    role: DEFAULT_MEMBER_ROLE,
                }}
            >
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <Form.Item
                        name="firstName"
                        label="First name"
                        rules={[
                            { required: true, message: 'Please enter the first name' },
                            { min: 3, message: 'First name must be at least 3 characters' },
                            ...wsRules('First name'),
                        ]}
                    >
                        <Input
                            placeholder="Enter"
                            maxLength={50}
                            onChange={e =>
                                form.setFieldValue(
                                    'firstName',
                                    e.target.value.replace(/[^a-zA-Z\s]/g, '')
                                )
                            }
                        />
                    </Form.Item>
                    <Form.Item
                        name="lastName"
                        label="Last name"
                        rules={[
                            { required: true, message: 'Please enter the last name' },
                            { min: 3, message: 'Last name must be at least 3 characters' },
                            ...wsRules('Last name'),
                        ]}
                    >
                        <Input
                            placeholder="Enter"
                            maxLength={50}
                            onChange={e =>
                                form.setFieldValue(
                                    'lastName',
                                    e.target.value.replace(/[^a-zA-Z\s]/g, '')
                                )
                            }
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    name="email"
                    label="Work email"
                    rules={[
                        { required: true, message: 'Please enter the work email' },
                        { type: 'email', message: 'Enter a valid email' },
                        ...wsRules('Work email'),
                    ]}
                >
                    <Input placeholder="Enter" maxLength={100} />
                </Form.Item>

                <Form.Item
                    name="mobileNo"
                    label="Mobile number"
                    rules={[
                        { required: true, message: 'Please enter the mobile number' },
                        {
                            pattern: /^[6-9]\d{9}$/,
                            message: 'Enter a valid 10-digit mobile number',
                        },
                    ]}
                >
                    <Input
                        placeholder="Enter 10-digit number"
                        maxLength={10}
                        inputMode="numeric"
                        prefix={<span className="mr-1 border-r pr-2 text-textBody">+91</span>}
                        onChange={e =>
                            form.setFieldValue('mobileNo', e.target.value.replace(/\D/g, ''))
                        }
                    />
                </Form.Item>

                <Form.Item name="department" hidden>
                    <Input />
                </Form.Item>

                <Form.Item
                    name="role"
                    label="Role"
                    rules={[{ required: true, message: 'Please select a role' }]}
                >
                    <Select
                        placeholder="Select a role"
                        loading={isLoadingRoles}
                        options={roleOptions}
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

                <Text className="block text-sm text-textBody">{PEOPLE_COPY.rolesNote}</Text>
            </Form>
        </Modal>
    );
};

export default InviteMemberModal;
