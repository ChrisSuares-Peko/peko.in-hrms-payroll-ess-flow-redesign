import { useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Typography } from 'antd';
import { v4 as uuid } from 'uuid';

import ShareholderModal from './ShareholderModal';
import ShareholderRow, { isShareholderFilled } from './ShareholderRow';
import { Shareholder } from './types';
import { ShareholderListController } from './useShareholderList';
import { computeShares, ShareholdingPatternController } from './useShareholdingPattern';

type Props = { ctrl: ShareholdingPatternController & ShareholderListController };

export default function ShareholderSection({ ctrl }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<{ shareholder: Shareholder; index: number } | null>(
        null
    );
    const [mode, setMode] = useState<'add' | 'edit'>('add');

    const {
        shareholders,
        paidUpShares,
        remainingShares,
        directors,
        directorLinkingConfigured,
        indianNationalityValue,
    } = ctrl;

    const sentinelError = ctrl.error('shareholders_valid');

    const rowErrorMessage = (s: Shareholder, idx: number) => {
        if (!sentinelError) return undefined;
        if (!isShareholderFilled(s)) return `Please add the details for Shareholder ${idx + 1}`;
        if (paidUpShares && computeShares(s.sharePercent, paidUpShares) <= 0)
            return 'Please allot at least 1 share';

        return undefined;
    };

    const closeAndReset = () => {
        setEditing(null);
        setIsOpen(false);
    };

    const handleAdd = () => {
        const placeholder: Shareholder = {
            id: uuid(),
            name: '',
            nationality: '',
            email: '',
            phone: '',
            pan: '',
            sharePercent: 0,
        };

        ctrl.addSpecific(placeholder);
        setEditing({ shareholder: placeholder, index: shareholders.length });
        setMode('add');
        setIsOpen(true);
    };

    const handleEdit = (s: Shareholder, idx: number) => {
        setEditing({ shareholder: s, index: idx });
        setMode('edit');
        setIsOpen(true);
    };

    const handleSave = (data: Omit<Shareholder, 'id'>) => {
        if (!editing) return;
        ctrl.updateShareholder(editing.shareholder.id, data);
        closeAndReset();
    };

    const handleCancel = () => {
        if (mode === 'add' && editing) ctrl.removeShareholder(editing.shareholder.id);
        closeAndReset();
    };

    const handleSharesChange = (id: string, sharesAllotted: number) => {
        const shareholder = shareholders.find(s => s.id === id);

        if (!shareholder || !paidUpShares) return;
        ctrl.updateShareholder(id, {
            ...shareholder,
            sharePercent: (sharesAllotted / paidUpShares) * 100,
        });
    };

    // Hide the freshly-appended draft instance while its add-modal is open.
    const visibleShareholders = shareholders.filter(
        s => !(mode === 'add' && isOpen && s.id === editing?.shareholder.id)
    );

    return (
        <>
            <Flex align="center" justify="space-between" gap={16} wrap="wrap">
                <Typography.Title level={5} className="!mb-0">
                    Shareholding Pattern
                </Typography.Title>
                <Button type="default" danger icon={<PlusOutlined />} onClick={handleAdd}>
                    Add Shareholder
                </Button>
            </Flex>

            <div className="mt-4">
                {visibleShareholders.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 p-6">
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No shareholders added yet"
                        />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-200">
                        <div className="divide-y divide-gray-100">
                            {visibleShareholders.map((s, idx) => (
                                <ShareholderRow
                                    key={s.id}
                                    errorMessage={rowErrorMessage(s, idx)}
                                    index={idx}
                                    paidUpShares={paidUpShares}
                                    remainingShares={remainingShares}
                                    shareholder={s}
                                    onDelete={() => ctrl.removeShareholder(s.id)}
                                    onEdit={() => handleEdit(s, idx)}
                                    onSharesChange={sharesAllotted =>
                                        handleSharesChange(s.id, sharesAllotted)
                                    }
                                />
                            ))}
                        </div>
                        {sentinelError && (
                            <p className="px-4 py-2 text-xs text-red-500">
                                Total shareholding must equal 100%
                            </p>
                        )}
                    </div>
                )}
            </div>

            {editing && (
                <ShareholderModal
                    directorLinkingConfigured={directorLinkingConfigured}
                    directors={directors}
                    indianNationalityValue={indianNationalityValue}
                    initial={editing.shareholder}
                    instanceIdx={editing.index}
                    isOpen={isOpen}
                    mode={mode}
                    others={shareholders.filter(s => s.id !== editing.shareholder.id)}
                    onCancel={handleCancel}
                    onSave={handleSave}
                />
            )}
        </>
    );
}
