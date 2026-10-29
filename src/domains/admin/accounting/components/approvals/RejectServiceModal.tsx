import { useEffect, useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Input, Modal, Typography } from 'antd';

import { ApprovalRow } from '../../types/approvals';
import { NOTE_MAX, decisionNoteError, offlineWarning, partnerLabel } from '../../utils/approvals';

type RejectServiceModalProps = {
    row: ApprovalRow | null;
    isSaving: boolean;
    onCancel: () => void;
    onConfirm: (note: string) => void;
};

export const rejectTitleFor = (row: ApprovalRow) => `Reject ${row.label} for ${partnerLabel(row)}?`;

const RejectServiceModal = ({ row, isSaving, onCancel, onConfirm }: RejectServiceModalProps) => {
    const [note, setNote] = useState('');

    useEffect(() => {
        setNote('');
    }, [row]);

    const error = decisionNoteError('REJECTED', note);

    return (
        <Modal
            open={row !== null}
            onCancel={onCancel}
            onOk={() => onConfirm(note.trim())}
            okText="Reject"
            okButtonProps={{ danger: true, loading: isSaving, disabled: error !== null }}
            title={row ? rejectTitleFor(row) : 'Reject service'}
            destroyOnHidden
        >
            {row && (
                <Flex vertical gap={14}>
                    {row.status === 'APPROVED' && (
                        <Flex
                            gap={8}
                            align="start"
                            className="rounded-xl border border-errorTextRed/30 bg-bgLightPink px-4 py-3"
                        >
                            <InfoCircleOutlined className="mt-0.5 shrink-0 text-errorTextRed" />
                            <Typography.Text className="text-sm text-errorTextRed">
                                {offlineWarning(row.label, [partnerLabel(row)])}
                            </Typography.Text>
                        </Flex>
                    )}
                    <Flex vertical gap={6}>
                        <Typography.Text className="text-sm text-textBody">
                            Note (required)
                        </Typography.Text>
                        <Input.TextArea
                            rows={3}
                            maxLength={NOTE_MAX}
                            value={note}
                            placeholder="Why this service is being rejected"
                            onChange={event => setNote(event.target.value)}
                        />
                    </Flex>
                </Flex>
            )}
        </Modal>
    );
};

export default RejectServiceModal;
