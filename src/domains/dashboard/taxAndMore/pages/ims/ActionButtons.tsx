import { useEffect, useState } from 'react';

import { Flex } from 'antd';

import { STATUS_LABELS, getStatusColor } from './imsUtils';
import { ImsInvoiceStatus } from '../../types';

const ActionButtons = ({
    status,
    isLoading = false,
    onAction,
}: {
    status: ImsInvoiceStatus;
    isLoading?: boolean;
    onAction: (s: ImsInvoiceStatus) => void;
}) => {
    const [loadingAction, setLoadingAction] = useState<ImsInvoiceStatus | null>(null);

    useEffect(() => {
        if (!isLoading) setLoadingAction(null);
    }, [isLoading]);

    const handleClick = (action: ImsInvoiceStatus) => {
        setLoadingAction(action);
        onAction(action);
    };

    const btnBase: React.CSSProperties = {
        height: 32,
        padding: '0 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    };

    if (status !== 'to-review') {
        return (
            <Flex gap={8}>
                <span
                    style={{
                        ...btnBase,
                        backgroundColor: getStatusColor(status),
                        color: 'white',
                        border: 'none',
                        opacity: isLoading ? 0.6 : 1,
                    }}
                >
                    {STATUS_LABELS[status]}
                </span>
                <button
                    type="button"
                    disabled={isLoading}
                    style={{
                        ...btnBase,
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        backgroundColor: 'white',
                        opacity: isLoading ? 0.6 : 1,
                    }}
                    onClick={() => handleClick('to-review')}
                >
                    {isLoading && loadingAction === 'to-review' && (
                        <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                    )}
                    Reset
                </button>
            </Flex>
        );
    }

    return (
        <Flex gap={8}>
            <button
                type="button"
                disabled={isLoading}
                style={{
                    ...btnBase,
                    border: '1px solid #81cf92',
                    color: '#43b75d',
                    backgroundColor: 'white',
                    opacity: isLoading && loadingAction !== null ? 0.6 : 1,
                }}
                onClick={() => handleClick('accepted')}
            >
                {isLoading && loadingAction === 'accepted' && (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                )}
                Accept
            </button>
            <button
                type="button"
                disabled={isLoading}
                style={{
                    ...btnBase,
                    border: '1px solid #fcd34d',
                    color: '#f59e0b',
                    backgroundColor: 'white',
                    opacity: isLoading && loadingAction !== null ? 0.6 : 1,
                }}
                onClick={() => handleClick('pending')}
            >
                {isLoading && loadingAction === 'pending' && (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                )}
                Pending
            </button>
            <button
                type="button"
                disabled={isLoading}
                style={{
                    ...btnBase,
                    border: '1px solid #fca5a5',
                    color: '#ef4444',
                    backgroundColor: 'white',
                    opacity: isLoading && loadingAction !== null ? 0.6 : 1,
                }}
                onClick={() => handleClick('rejected')}
            >
                {isLoading && loadingAction === 'rejected' && (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                )}
                Reject
            </button>
        </Flex>
    );
};

export default ActionButtons;
