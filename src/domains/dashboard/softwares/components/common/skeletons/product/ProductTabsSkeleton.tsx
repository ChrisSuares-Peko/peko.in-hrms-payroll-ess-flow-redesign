import { Skeleton } from 'antd';

const ProductTabsSkeleton = () => (
    <div className="flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton.Input key={i} active size="small" style={{ width: 100 }} />
            ))}
        </div>

        {/* Section Title */}
        <Skeleton.Input active size="large" style={{ width: '20%' }} />

        {/* Paragraph */}
        <div className="flex flex-col gap-3">
            <Skeleton.Input active block />
            <Skeleton.Input active block />
            <Skeleton.Input active block />
            <Skeleton.Input active style={{ width: '80%' }} />
        </div>
    </div>
);

export default ProductTabsSkeleton;
