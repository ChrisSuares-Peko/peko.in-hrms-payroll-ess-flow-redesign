import {
    CheckCircleFilled,
    ExportOutlined,
    InfoCircleOutlined,
    LoadingOutlined,
    ReloadOutlined,
    RightOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Button, Flex, Tooltip, Typography } from 'antd';

import type { FetchState } from '../../utils/gstr2bTypes';

interface Props {
    fetchState: FetchState;
    periodLabel: string;
    isReconciled: boolean | null;
    hasGstin: boolean;
    onFetch: () => void;
    onMarkReconciled: () => void;
    onFetchStateChange: (state: FetchState) => void;
    onExportCsv: () => void;
}

const reconTooltip = (isReconciled: boolean | null) =>
    isReconciled ? 'Already reconciled' : undefined;

const PageHeader = ({
    fetchState,
    periodLabel,
    isReconciled,
    hasGstin,
    onFetch,
    onMarkReconciled,
    onFetchStateChange,
    onExportCsv,
}: Props) => {
    const dataLoaded =
        fetchState === 'loaded' || fetchState === 'regenerating' || fetchState === 'regen-polling';
    const reconDisabled = !dataLoaded || isReconciled === true;

    return (
        <Flex align="start" justify="space-between" wrap="wrap" gap={12} className="py-1">
            <Flex vertical gap={2}>
                <Typography.Text
                    className="font-semibold"
                    style={{ fontSize: 20, color: '#1f2937' }}
                >
                    GSTR-2B Purchase Register
                </Typography.Text>
                <Typography.Text className="text-sm" style={{ color: '#6b7280' }}>
                    Auto-populated from GST Portal · Period: {periodLabel}
                </Typography.Text>
            </Flex>

            <Flex gap={8} align="center" wrap="wrap">
                <Tooltip title={!dataLoaded ? 'Fetch GSTR-2B first' : reconTooltip(isReconciled)}>
                    <Button
                        icon={
                            isReconciled ? (
                                <CheckCircleFilled style={{ color: '#43b75d' }} />
                            ) : (
                                <InfoCircleOutlined />
                            )
                        }
                        disabled={reconDisabled}
                        onClick={reconDisabled ? undefined : onMarkReconciled}
                        style={{
                            height: 36,
                            fontSize: 13,
                            fontWeight: 500,
                            ...(!reconDisabled && {
                                borderColor: isReconciled ? '#43b75d' : '#ff4f4f',
                                color: isReconciled ? '#43b75d' : '#ff4f4f',
                            }),
                        }}
                    >
                        {isReconciled ? 'Reconciled' : 'Mark Reconciled'}
                    </Button>
                </Tooltip>
                <Button
                    icon={<ExportOutlined />}
                    style={{
                        height: 36,
                        fontSize: 13,
                        fontWeight: 500,
                        borderColor: '#ff4f4f',
                        color: '#ff4f4f',
                    }}
                    onClick={onExportCsv}
                >
                    Export Excel
                </Button>

                {fetchState === 'idle' && (
                    <Tooltip
                        title={
                            !hasGstin
                                ? 'No GST setup found. Please configure a GSTIN first.'
                                : undefined
                        }
                    >
                        <Button
                            type="primary"
                            danger
                            icon={<RightOutlined />}
                            iconPosition="end"
                            disabled={!hasGstin}
                            style={{ height: 36, fontSize: 13, fontWeight: 500 }}
                            onClick={onFetch}
                        >
                            Fetch GSTR-2B
                        </Button>
                    </Tooltip>
                )}

                {fetchState === 'fetching' && (
                    <Button
                        type="primary"
                        danger
                        icon={<LoadingOutlined spin />}
                        iconPosition="end"
                        disabled
                        style={{ height: 36, fontSize: 13, fontWeight: 500 }}
                    >
                        Fetching...
                    </Button>
                )}

                {(fetchState === 'loaded' || fetchState === 'regenerating') && (
                    <>
                        <Button
                            icon={<SyncOutlined />}
                            style={{
                                height: 36,
                                fontSize: 13,
                                fontWeight: 500,
                                borderColor: '#ff4f4f',
                                color: '#ff4f4f',
                            }}
                            onClick={() => onFetchStateChange('regenerating')}
                        >
                            Regenerate 2B
                        </Button>
                        <Button
                            type="primary"
                            danger
                            icon={<ReloadOutlined />}
                            style={{ height: 36, fontSize: 13, fontWeight: 500 }}
                            onClick={onFetch}
                        >
                            Refresh 2B
                        </Button>
                    </>
                )}
            </Flex>
        </Flex>
    );
};

export default PageHeader;
