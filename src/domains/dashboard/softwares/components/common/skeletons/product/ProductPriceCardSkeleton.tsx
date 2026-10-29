import { Skeleton } from 'antd';

const ProductPriceCardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
        <Skeleton.Input active size="large" style={{ width: '70%' }} />
        <Skeleton.Input active size="small" style={{ width: '60%' }} />

        <Skeleton.Button active block size="large" shape="round" />

        <Skeleton.Input active style={{ width: '80%' }} />
    </div>
);

export default ProductPriceCardSkeleton;
