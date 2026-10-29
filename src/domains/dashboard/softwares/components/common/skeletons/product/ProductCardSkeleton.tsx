import { Col, Skeleton } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

type Props = { isLoading: boolean };

const ProductCardSkeleton = ({ isLoading }: Props) => {
    if (!isLoading) return null;
    return (
        <>
            {Array.from({ length: 12 }).map((_, index) => (
                <Col key={index} xs={24} sm={24} md={12} lg={8} xl={8} xxl={6}>
                    <div className="w-full">
                        <ProductCardSkeletonItem />
                    </div>
                </Col>
            ))}
        </>
    );
};

export default ProductCardSkeleton;

const ProductCardSkeletonItem = () => {
    const screens = useScreenSize();

    return (
        <div className="bg-white rounded-2xl shadow-md p-5 h-full flex flex-col gap-4">
            {/* Top Section */}
            <div className="flex items-start gap-4">
                <Skeleton.Avatar active shape="square" size={screens.sm ? 80 : 60} />

                <div className="flex flex-col gap-2 flex-1">
                    <Skeleton.Input active size="small" style={{ width: '60%' }} />
                    <Skeleton.Input active size="small" style={{ width: '40%' }} />
                </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
                <Skeleton.Input active size="small" style={{ width: '100%' }} />
                <Skeleton.Input active size="small" style={{ width: '95%' }} />
                <Skeleton.Input active size="small" style={{ width: '80%' }} />
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-auto">
                <Skeleton.Input active size="small" style={{ width: '120px' }} />
                <Skeleton.Button active size="small" />
            </div>
        </div>
    );
};
