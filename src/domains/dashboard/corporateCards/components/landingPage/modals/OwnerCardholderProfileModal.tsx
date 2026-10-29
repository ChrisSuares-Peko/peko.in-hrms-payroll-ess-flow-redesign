import { Button, Form, Input, Modal, Typography } from 'antd';

import { ADMIN_ROLE } from '../../../utils/cardRoles';
import { MODAL_CLOSE_ICON, ROUNDED_MODAL_CLASSNAMES } from '../../common/modalProps';

const { Text } = Typography;

export interface OwnerCardholderProfileForm {
    name: string;
    mobileNo: string;
}

interface OwnerCardholderProfileModalProps {
    open: boolean;
    isSubmitting?: boolean;
    onCancel: () => void;
    onSubmit: (values: OwnerCardholderProfileForm) => void;
}

/**
 * Collected the first time the account owner switches to Employee, before the switch is sent.
 *
 * It has to be their PERSONAL name and mobile. The corporate record holds the company name and the registered
 * business number, and these two values become a Pine Labs KYC record — which verifies an individual and OTPs
 * a personal handset — and then the name printed on a card.
 *
 * Shown BEFORE the switch, not after, because switching reloads the page: anything rendered afterwards is torn
 * down with it. Being pre-switch also keeps the session Admin, which is what the role catalogue behind this
 * screen requires.
 */
const OwnerCardholderProfileModal = ({
    open,
    isSubmitting,
    onCancel,
    onSubmit,
}: OwnerCardholderProfileModalProps) => {
    const [form] = Form.useForm<OwnerCardholderProfileForm>();

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            destroyOnHidden
            centered
            classNames={ROUNDED_MODAL_CLASSNAMES}
            closeIcon={MODAL_CLOSE_ICON}
            width={520}
            title="Set up your card account"
            footer={
                <div className="flex justify-end gap-3">
                    <Button danger onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="primary" loading={isSubmitting} onClick={() => form.submit()}>
                        Continue
                    </Button>
                </div>
            }
        >
            <Text className="mb-5 block text-sm text-textBody">
                To hold a card of your own you need a cardholder profile. Enter your personal
                details as they appear on your ID — these are verified with the issuer, so they
                can’t be changed afterwards.
            </Text>

            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <Form.Item
                    name="name"
                    label="Full name"
                    rules={[
                        { required: true, message: 'Please enter your name' },
                        { max: 50, message: 'Name cannot exceed 50 characters' },
                        {
                            pattern: /^[A-Za-z ]+$/,
                            message: 'Name can only contain letters and spaces',
                        },
                        {
                            validator: (_, value: string) => {
                                if (!value) return Promise.resolve();
                                if (/^\s|\s$/.test(value))
                                    return Promise.reject(
                                        new Error('Name cannot start or end with a space')
                                    );
                                if (/\s{2,}/.test(value))
                                    return Promise.reject(
                                        new Error('Name cannot contain consecutive spaces')
                                    );
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <Input placeholder="Enter your name as on your ID" />
                </Form.Item>

                <Form.Item
                    name="mobileNo"
                    label="Mobile number"
                    rules={[
                        { required: true, message: 'Please enter your mobile number' },
                        {
                            pattern: /^[6-9]\d{9}$/,
                            message: 'Please enter a valid 10-digit mobile number',
                        },
                    ]}
                >
                    <Input placeholder="Enter your mobile number" maxLength={10} />
                </Form.Item>

                <Form.Item label="Role">
                    <Input value={ADMIN_ROLE} disabled />
                    <Text className="mt-1 block text-xs text-textGreyLight">
                        You remain the account admin — switching only changes the view you’re
                        working in.
                    </Text>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default OwnerCardholderProfileModal;
