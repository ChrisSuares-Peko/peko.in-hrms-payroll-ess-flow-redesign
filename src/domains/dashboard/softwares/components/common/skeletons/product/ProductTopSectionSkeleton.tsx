import { Skeleton } from 'antd';

const ProductTopSectionSkeleton = () => (
    <div className="flex gap-6">
        <Skeleton.Avatar active shape="circle" size={100} />

        <div className="flex flex-col gap-3 flex-1">
            <Skeleton.Input active size="large" style={{ width: '40%' }} />
            <Skeleton.Input active size="small" style={{ width: '30%' }} />
            <Skeleton.Input active size="small" style={{ width: '50%' }} />

            <div className="flex gap-3 items-center">
                <Skeleton.Input active size="small" style={{ width: 60 }} />
                <Skeleton.Button active size="small" shape="round" />
            </div>
        </div>
    </div>
);

export default ProductTopSectionSkeleton;
