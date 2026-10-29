import type { FC } from 'react';

import { Skeleton } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

interface CategoriesSkeletonProps {
    loading: boolean;
}

const CategoriesSkeleton: FC<CategoriesSkeletonProps> = ({ loading }) => {
    const skeletonCount = 6;

    const skeletons = Array.from({ length: skeletonCount }, (_, index) => (
        <CategoriesSkeletonItem key={index} />
    ));

    return <>{loading && skeletons}</>;
};

const CategoriesSkeletonItem: FC = () => {
    const screens = useScreenSize();
    return (
        <Skeleton.Avatar
            size="large"
            shape="circle"
            style={
                screens.sm
                    ? { width: '5.5rem', height: '5.5rem' }
                    : { width: '3rem', height: '3rem' }
            }
        />
    );
};

export default CategoriesSkeleton;
