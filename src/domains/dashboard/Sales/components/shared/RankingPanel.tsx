import React from 'react';

import { Badge, Empty, Flex, Pagination, Typography } from 'antd';

import CardRowsSkeleton from './CardRowsSkeleton';
import { ACTIVITY_DOT_COLORS, RANKING_VARIANT_STYLES } from '../../constants/style';
import { RankingData, RankingVariant } from '../../types/payments';
import { getRankingRowValues, toInitials } from '../../utils/helperFunctions';

interface RankingPanelProps {
    title: string;
    data: RankingData[];
    variant: RankingVariant;
    isLoading?: boolean;
    onViewAll?: () => void;
    pagination?: {
        current: number;
        total: number;
        pageSize: number;
        onChange: (page: number) => void;
    };
}

const RankingRow = ({
    item,
    variant,
    rank,
}: {
    item: RankingData;
    variant: RankingVariant;
    rank: number;
}) => {
    const styles = RANKING_VARIANT_STYLES[variant];
    const { secondaryText, primaryRight, secondaryRight } = getRankingRowValues(item, variant);
    const activityColor =
        variant === 'activity'
            ? (ACTIVITY_DOT_COLORS[item.subtitle ?? ''] ?? '#94A3B8')
            : undefined;

    let leftEl;
    if (variant === 'activity') {
        leftEl = (
            <Badge
                color={ACTIVITY_DOT_COLORS[item.subtitle ?? ''] ?? '#94A3B8'}
                className="flex-shrink-0"
            />
        );
    } else if (variant === 'due') {
        const initials = toInitials(item.name);
        leftEl = (
            <Flex
                align="center"
                justify="center"
                className={`w-10 h-10 rounded-full flex-shrink-0 ${styles.badge}`}
            >
                <Typography.Text className={`text-sm font-semibold ${styles.badgeText}`}>
                    {initials}
                </Typography.Text>
            </Flex>
        );
    } else {
        leftEl = (
            <Flex
                align="center"
                justify="center"
                className={`w-10 h-10 rounded-full flex-shrink-0 ${styles.badge}`}
            >
                <Typography.Text className={`text-sm font-semibold ${styles.badgeText}`}>
                    #{rank}
                </Typography.Text>
            </Flex>
        );
    }

    return (
        <Flex justify="space-between" align="center" className="bg-white rounded-xl px-4 py-3">
            <Flex align="center" gap={8} className="flex-1">
                {leftEl}
                <Flex vertical gap={2}>
                    <Typography.Text className="text-sm font-medium">{item.name}</Typography.Text>
                    {secondaryText && (
                        <Typography.Text className="text-[#A1A1AA] text-xs font-normal">
                            {secondaryText}
                        </Typography.Text>
                    )}
                </Flex>
            </Flex>
            <Flex vertical align="flex-end" gap={2}>
                {primaryRight && (
                    <Typography.Text
                        className={`text-sm font-semibold ${styles.primaryRight}`}
                        style={activityColor ? { color: activityColor } : undefined}
                    >
                        {primaryRight}
                    </Typography.Text>
                )}
                {secondaryRight && (
                    <Typography.Text className={`text-xs font-normal ${styles.secondaryRight}`}>
                        {secondaryRight}
                    </Typography.Text>
                )}
            </Flex>
        </Flex>
    );
};

const RankingPanel: React.FC<RankingPanelProps> = ({ title, data, variant, isLoading = false, onViewAll, pagination }) => {
    const renderContent = () => {
        if (isLoading) {
            return <CardRowsSkeleton count={4} />;
        }
        if (data.length > 0) {
            return data.map((item, i) => (
                <RankingRow key={item.id} item={item} variant={variant} rank={i + 1} />
            ));
        }
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />;
    };

    return (
        <Flex vertical gap={20} className="flex-1 bg-[#F9F9F9] rounded-2xl p-6">
            <Flex justify="space-between" align="center">
                <Typography.Text className="text-base font-semibold leading-6">{title}</Typography.Text>
                {onViewAll && (
                    <Typography.Text
                        className="text-[#FF4F4F] text-sm font-normal cursor-pointer"
                        onClick={onViewAll}
                    >
                        View all
                    </Typography.Text>
                )}
            </Flex>
            <Flex vertical gap={12}>
                {renderContent()}
            </Flex>
            {pagination && pagination.total > pagination.pageSize && (
                <Flex justify="flex-end">
                    <Pagination
                        current={pagination.current}
                        total={pagination.total}
                        pageSize={pagination.pageSize}
                        onChange={pagination.onChange}
                        showSizeChanger={false}
                    />
                </Flex>
            )}
        </Flex>
    );
};

export default React.memo(RankingPanel);
