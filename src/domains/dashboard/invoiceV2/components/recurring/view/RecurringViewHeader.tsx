import React from 'react';

import {
    ArrowLeftOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { Button, Skeleton } from 'antd';

type Props = {
    scheduleName: string | undefined;
    subtitle: string;
    isLoading: boolean;
    isActive: boolean;
    isPaused: boolean;
    isEnded: boolean;
    isActioning: boolean;
    onBack: () => void;
    onPause: () => void;
    onResume: () => void;
    onEnd: () => void;
};

const RecurringViewHeader: React.FC<Props> = ({
    scheduleName,
    subtitle,
    isLoading,
    isActive,
    isPaused,
    isEnded,
    isActioning,
    onBack,
    onPause,
    onResume,
    onEnd,
}) => (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-3">
        <div>
            {isLoading ? (
                <>
                    <Skeleton.Input active size="default" style={{ width: 280 }} />
                    <div className="mt-1">
                        <Skeleton.Input active size="small" style={{ width: 180 }} />
                    </div>
                </>
            ) : (
                <>
                    <h1 className="text-xl font-bold text-gray-900 m-0">{scheduleName ?? '—'}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                </>
            )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto sm:shrink-0">
            <Button className="w-full sm:w-auto" icon={<ArrowLeftOutlined />} onClick={onBack}>
                Back
            </Button>
            {!isLoading && !isEnded && (
                <>
                    {isActive && (
                        <Button
                            className="w-full sm:w-auto"
                            icon={<PauseCircleOutlined />}
                            loading={isActioning}
                            onClick={onPause}
                        >
                            Pause
                        </Button>
                    )}
                    {isPaused && (
                        <Button
                            className="w-full sm:w-auto"
                            icon={<PlayCircleOutlined />}
                            loading={isActioning}
                            onClick={onResume}
                        >
                            Resume
                        </Button>
                    )}
                    <Button
                        className="w-full sm:w-auto"
                        danger
                        icon={<StopOutlined />}
                        loading={isActioning}
                        onClick={onEnd}
                    >
                        End schedule
                    </Button>
                </>
            )}
        </div>
    </div>
);

export default RecurringViewHeader;
