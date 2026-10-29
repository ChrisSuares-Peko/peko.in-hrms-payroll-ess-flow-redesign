import { Button, Modal, Typography } from 'antd';

import { Member } from '../../../utils/types';
import { MODAL_CLOSE_ICON, ROUNDED_MODAL_CLASSNAMES } from '../../common/modalProps';

const { Text } = Typography;

interface RemoveMemberModalProps {
    open: boolean;
    member: Member | null;
    isLoading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/** Destructive confirmation before removing a member and terminating their cards. */
const RemoveMemberModal = ({
    open,
    member,
    isLoading,
    onClose,
    onConfirm,
}: RemoveMemberModalProps) => (
    <Modal
        open={open}
        onCancel={onClose}
        destroyOnHidden
        centered
        classNames={ROUNDED_MODAL_CLASSNAMES}
        closeIcon={MODAL_CLOSE_ICON}
        width={480}
        title={`Remove ${member?.name ?? 'member'}?`}
        footer={
            <div className="flex justify-end gap-3">
                <Button disabled={isLoading} onClick={onClose}>
                    Cancel
                </Button>
                <Button type="primary" danger loading={isLoading} onClick={onConfirm}>
                    Remove &amp; terminate cards
                </Button>
            </div>
        }
    >
        <Text className="block text-sm text-textBody">
            They&apos;ll lose access to the workspace. This action cannot be undone.
        </Text>
    </Modal>
);

export default RemoveMemberModal;
