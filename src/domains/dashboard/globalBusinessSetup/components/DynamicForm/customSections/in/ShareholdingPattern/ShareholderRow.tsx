import { ReactNode, useEffect, useState } from 'react';

import { DeleteOutlined, EditOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Tag, Tooltip } from 'antd';

import { Shareholder } from './types';
import { computeShares } from './useShareholdingPattern';

type Props = {
    shareholder: Shareholder;
    index: number;
    paidUpShares: number | null;
    remainingShares: number | null;
    errorMessage?: string;
    onEdit: () => void;
    onDelete: () => void;
    onSharesChange: (sharesAllotted: number) => void;
};

export const isShareholderFilled = (s: Shareholder) =>
    !!(s.name || s.email || s.sharePercent || s.pan);

function LabelValue({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-xs text-gray-400">{label}</p>
            <div className="text-sm font-semibold text-gray-800">{children}</div>
        </div>
    );
}

export default function ShareholderRow({
    shareholder: s,
    index,
    paidUpShares,
    remainingShares,
    errorMessage,
    onEdit,
    onDelete,
    onSharesChange,
}: Props) {
    const filled = isShareholderFilled(s);
    const savedShares = paidUpShares ? computeShares(s.sharePercent, paidUpShares) : 0;
    const holdingPct = paidUpShares && savedShares ? (savedShares / paidUpShares) * 100 : null;

    const [inputValue, setInputValue] = useState(savedShares > 0 ? String(savedShares) : '');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) setInputValue(savedShares > 0 ? String(savedShares) : '');
    }, [savedShares, isFocused]);

    const parsedInput = parseInt(inputValue || '0', 10);
    const liveHolding =
        isFocused && paidUpShares && parsedInput > 0
            ? (parsedInput / paidUpShares) * 100
            : holdingPct;

    const maxForRow = (remainingShares ?? 0) + savedShares;

    const handleBlur = () => {
        setIsFocused(false);
        if (!paidUpShares || parsedInput <= 0) return;
        onSharesChange(Math.min(parsedInput, maxForRow));
    };

    if (!filled) {
        return (
            <div className="grid grid-cols-[36px_1fr_auto] items-center gap-4 px-4 py-4">
                <span
                    className={`grid size-9 place-items-center rounded-xl text-sm font-semibold ${
                        errorMessage ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'
                    }`}
                >
                    {index + 1}
                </span>
                <p className="text-sm text-gray-400">
                    {errorMessage ? (
                        <span className="flex items-center gap-1 text-red-500">
                            <InfoCircleOutlined />
                            {errorMessage}
                        </span>
                    ) : (
                        'No details added yet'
                    )}
                </p>
                <Button icon={<PlusOutlined />} onClick={onEdit}>
                    Add
                </Button>
            </div>
        );
    }

    return (
        <div
            className={`grid grid-cols-[36px_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-4 ${
                errorMessage ? 'bg-red-50/50' : ''
            }`}
        >
            {errorMessage && (
                <p className="col-span-full flex items-center gap-1 text-xs text-red-500">
                    <InfoCircleOutlined />
                    {errorMessage}
                </p>
            )}
            <span className="grid size-9 place-items-center rounded-xl bg-red-50 text-sm font-semibold text-red-500">
                {index + 1}
            </span>

            <LabelValue label="Name">
                <span className="flex items-center gap-2">
                    <span className="truncate">{s.name}</span>
                    {s.isDirector && (
                        <Tag color="red" className="!mr-0 shrink-0">
                            Director
                        </Tag>
                    )}
                </span>
            </LabelValue>

            <LabelValue label="Nationality">
                <span>{s.nationality || '—'}</span>
            </LabelValue>

            <LabelValue label="Shares Allotted">
                <Input
                    disabled={!paidUpShares}
                    placeholder={paidUpShares ? '0' : '—'}
                    value={inputValue}
                    onBlur={handleBlur}
                    onChange={e => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                    onFocus={() => setIsFocused(true)}
                />
            </LabelValue>

            <LabelValue label="% Holding">
                <span>{liveHolding !== null ? `${liveHolding.toFixed(2)}%` : '—'}</span>
            </LabelValue>

            <div className="flex items-center justify-end gap-1">
                <Tooltip title="Edit details">
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={onEdit} />
                </Tooltip>
                <Tooltip title="Remove">
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={onDelete}
                    />
                </Tooltip>
            </div>
        </div>
    );
}
