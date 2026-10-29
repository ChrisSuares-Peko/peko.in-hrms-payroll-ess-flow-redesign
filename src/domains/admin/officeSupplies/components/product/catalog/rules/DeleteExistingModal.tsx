import type { FC } from 'react';

import { Button, Modal } from 'antd';

import { plural } from './ruleUtils';

export interface DeleteExistingPrompt {
    /** e.g. "Blocking Sai Gases" */
    ruleLabel: string;
    count: number;
    sample: string[];
    /** false for banned words: they are never kept, so only Delete is offered */
    allowKeep?: boolean;
}

interface Props {
    prompt: DeleteExistingPrompt | null;
    loading: boolean;
    onKeep: () => void;
    onDelete: () => void;
    onCancel: () => void;
}

/**
 * Asked after a preview finds stored products a new rule now hides: the rule
 * always stops future ones; this decides what happens to those already listed.
 */
const DeleteExistingModal: FC<Props> = ({ prompt, loading, onKeep, onDelete, onCancel }) => (
    <Modal
        open={!!prompt}
        title="Delete products already in the catalog?"
        onCancel={onCancel}
        maskClosable={!loading}
        closable={!loading}
        footer={[
            prompt?.allowKeep === false ? (
                <Button key="cancel" disabled={loading} onClick={onCancel}>
                    Cancel
                </Button>
            ) : (
                <Button key="keep" disabled={loading} onClick={onKeep}>
                    Keep them hidden
                </Button>
            ),
            <Button key="delete" type="primary" danger loading={loading} onClick={onDelete}>
                Delete {prompt ? plural(prompt.count, 'product') : ''}
            </Button>,
        ]}
    >
        {prompt && (
            <div className="flex flex-col gap-3 pt-1 text-[13px] text-[#344054]">
                <span>
                    {prompt.ruleLabel} hides matching products from corporates.{' '}
                    <span className="font-semibold text-[#101828]">
                        {plural(prompt.count, 'product')}
                    </span>{' '}
                    already in the catalog match it.
                </span>
                {prompt.sample.length > 0 && (
                    <ul className="m-0 rounded-lg bg-[#F9FAFB] py-2 pl-8 pr-3 text-[12px] text-[#475467]">
                        {prompt.sample.map(name => (
                            <li key={name} className="truncate">
                                {name}
                            </li>
                        ))}
                        {prompt.count > prompt.sample.length && (
                            <li className="list-none text-[#98A2B3]">
                                and {prompt.count - prompt.sample.length} more
                            </li>
                        )}
                    </ul>
                )}
                <span className="text-[12px] text-[#667085]">
                    {prompt.allowKeep === false
                        ? 'Banned products are not stored, so these are deleted. They come back on the next sync if you remove the word.'
                        : 'Kept products stay in the catalog, hidden, and show again if you lift the rule. Deleting removes them now; they come back on the next sync if the seller still lists them, hidden by this rule.'}
                </span>
            </div>
        )}
    </Modal>
);

export default DeleteExistingModal;
