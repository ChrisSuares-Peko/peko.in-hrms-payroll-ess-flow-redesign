import { Checkbox, Collapse, Flex, Tag, Typography } from 'antd';

import { SyncOp, SyncOpKind } from '../../types/packageSync';
import { FIELD_LABELS, formatChangeValue, formatHint, isActionable, SYNC_KIND_META } from '../../utils/packageSync';

const { Text } = Typography;

type Props = {
    kind: SyncOpKind;
    ops: SyncOp[];
    selected?: Set<string>;
    onToggle: (opIds: string[], checked: boolean) => void;
    disabled?: boolean;
};

const SyncOpSection = ({ kind, ops, selected, onToggle, disabled }: Props) => {
    if (ops.length === 0) return null;
    const meta = SYNC_KIND_META[kind];
    const actionableIds = ops.filter(isActionable).map(op => op.id);
    const selectedCount = actionableIds.filter(id => selected?.has(id)).length;
    const allSelected = actionableIds.length > 0 && selectedCount === actionableIds.length;

    const header = (
        <Flex align="center" gap={8} wrap="wrap">
            {meta.selectable && (
                <Checkbox
                    checked={allSelected}
                    indeterminate={selectedCount > 0 && !allSelected}
                    disabled={disabled || actionableIds.length === 0}
                    onChange={e => onToggle(actionableIds, e.target.checked)}
                />
            )}
            <Tag color={meta.color} className="m-0">
                {meta.label} ({ops.length})
            </Tag>
            {meta.helper && (
                <Text type="secondary" className="text-xs">
                    {meta.helper}
                </Text>
            )}
        </Flex>
    );

    const renderOp = (op: SyncOp) => (
        <Flex key={op.id} vertical gap={2}>
            <Flex align="center" gap={8} wrap="wrap">
                {meta.selectable && (
                    <Checkbox
                        checked={selected?.has(op.id) ?? false}
                        disabled={disabled || !op.selectable}
                        onChange={e => onToggle([op.id], e.target.checked)}
                    />
                )}
                <Text className="text-sm">{op.packageName}</Text>
                {op.externalId ? (
                    <Text code className="text-xs">
                        {op.externalId}
                    </Text>
                ) : (
                    <Text type="secondary" className="text-xs">
                        No External ID
                    </Text>
                )}
                {op.packageIds && op.packageIds.length > 0 && (
                    <Text type="secondary" className="text-xs">
                        packages #{op.packageIds.join(', #')}
                    </Text>
                )}
                {op.reason && (
                    <Text type="secondary" className="text-xs">
                        {op.reason.replace(/-/g, ' ')}
                    </Text>
                )}
            </Flex>
            {op.changes && (
                <Flex vertical gap={2} className="pl-6">
                    {Object.entries(op.changes).map(([field, change]) => (
                        <Flex key={field} gap={6} wrap="wrap" className="text-xs">
                            <Text type="secondary">{FIELD_LABELS[field] ?? field}:</Text>
                            <Text delete className="text-gray-400">
                                {formatChangeValue(change.from)}
                            </Text>
                            <Text type="secondary">→</Text>
                            <Text strong>{formatChangeValue(change.to)}</Text>
                        </Flex>
                    ))}
                </Flex>
            )}
            {op.hint && (
                <Text type="warning" className="pl-6 text-xs">
                    {formatHint(op.hint)}
                </Text>
            )}
        </Flex>
    );

    const rows = (
        <Flex vertical gap={8} className="pl-6">
            {ops.map(renderOp)}
        </Flex>
    );

    if (kind === 'unchanged') {
        return <Collapse size="small" ghost items={[{ key: kind, label: header, children: rows }]} />;
    }

    return (
        <Flex vertical gap={8}>
            {header}
            {rows}
        </Flex>
    );
};

export default SyncOpSection;
