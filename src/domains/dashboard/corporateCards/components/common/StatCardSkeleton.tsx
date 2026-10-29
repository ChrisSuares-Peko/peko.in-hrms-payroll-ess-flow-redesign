import { Skeleton } from 'antd';

/** Placeholder for a StatCard tile while its KPI data is still loading. */
const StatCardSkeleton = () => (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-bgLightGray px-5 py-4 xl:py-5">
        <Skeleton.Avatar active size={36} shape="circle" />
        <Skeleton active title={false} paragraph={{ rows: 3, width: ['60%', '40%', '80%'] }} />
    </div>
);

export default StatCardSkeleton;
