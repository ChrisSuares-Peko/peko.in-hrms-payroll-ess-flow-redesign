import { Tabs } from 'antd';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';
import { useProductTabs } from '@src/domains/dashboard/softwares/hooks/product/useProductTabs';

import ProductTabsSkeleton from '../../../common/skeletons/product/ProductTabsSkeleton';

const TabNavigator = () => {
    const { tabItems, onTabChange } = useProductTabs();
    const { isLoading } = useProductContext();
    return (
        <>
            {isLoading ? (
                <ProductTabsSkeleton />
            ) : (
                <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} />
            )}
        </>
    );
};

export default TabNavigator;
