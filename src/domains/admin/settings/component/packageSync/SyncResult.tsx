import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    MinusCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Collapse, Flex, Result, Statistic, Typography } from 'antd';

import { SyncApplyResult, SyncPreview } from '../../types/packageSync';
import { totalApplied } from '../../utils/packageSync';

type Props = {
    result: SyncApplyResult;
    preview: SyncPreview;
    partnerLabel: (partnerId: string) => string;
};

const SyncResult = ({ result, preview, partnerLabel }: Props) => {
    const totals = totalApplied(result);
    const applied = totals.added + totals.updated + totals.deactivated;
    const opName = (partnerId: string, opId: string) =>
        preview.partners.find(p => p.partnerId === partnerId)?.ops.find(op => op.id === opId)?.packageName ??
        opId;

    return (
        <Flex vertical gap={20}>
            <Result
                status={applied > 0 ? 'success' : 'warning'}
                title={applied > 0 ? 'Sync applied' : 'Nothing was applied'}
                style={{ padding: 0 }}
            />
            <Flex justify="center" gap={32} wrap="wrap">
                <Statistic
                    title="Added"
                    value={totals.added}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                />
                <Statistic
                    title="Updated"
                    value={totals.updated}
                    valueStyle={{ color: '#1677ff' }}
                    prefix={<SyncOutlined />}
                />
                <Statistic
                    title="Deactivated"
                    value={totals.deactivated}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<MinusCircleOutlined />}
                />
            </Flex>
            {result.partners.map(p => (
                <div key={p.partnerId} className="rounded-xl border border-borderCard p-4">
                    <Typography.Text strong>{partnerLabel(p.partnerId)}</Typography.Text>
                    <Typography.Text type="secondary" className="block text-xs">
                        Added {p.counts.added} · Updated {p.counts.updated} · Deactivated {p.counts.deactivated}
                    </Typography.Text>
                    {p.error && (
                        <Typography.Text type="danger" className="block text-xs">
                            Rolled back: {p.error}
                        </Typography.Text>
                    )}
                    {p.skipped.length > 0 && (
                        <Collapse
                            size="small"
                            ghost
                            items={[
                                {
                                    key: 'skipped',
                                    label: (
                                        <Flex gap={8} align="center">
                                            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                                            <Typography.Text>Skipped ({p.skipped.length})</Typography.Text>
                                        </Flex>
                                    ),
                                    children: p.skipped.map(s => (
                                        <Flex key={s.opId} gap={8} wrap="wrap">
                                            <Typography.Text className="text-sm">
                                                {opName(p.partnerId, s.opId)}
                                            </Typography.Text>
                                            <Typography.Text type="danger" className="text-xs">
                                                — {s.reason}
                                            </Typography.Text>
                                        </Flex>
                                    )),
                                },
                            ]}
                        />
                    )}
                </div>
            ))}
        </Flex>
    );
};

export default SyncResult;
