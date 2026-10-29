import type { TabsProps } from 'antd';

import FeaturesTab from '../../components/product/sections/productDetails/featuresTab';
import IntegrationsTab from '../../components/product/sections/productDetails/integrationTab';
import OverViewTab from '../../components/product/sections/productDetails/overViewTab';
import ProductImagesTab from '../../components/product/sections/productDetails/productImagesTab';
import RatingsTab from '../../components/product/sections/productDetails/ratingsTab';
import { useProductContext } from '../../contexts/ProductContext';

export const useProductTabs = () => {
    const { accessibleImages, setPlayingVideoIndex } = useProductContext();
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Overview',
            children: <OverViewTab />,
        },
        {
            key: '2',
            label: 'Features',
            children: <FeaturesTab />,
        },
        {
            key: '3',
            label: 'Integrations',
            children: <IntegrationsTab />,
        },
        {
            key: '4',
            label: 'Ratings',
            children: <RatingsTab />,
        },
        ...(accessibleImages.length > 0
            ? [
                  {
                      key: '5',
                      label: 'Product Images',
                      children: <ProductImagesTab />,
                  },
              ]
            : []),
    ];

    const onTabChange = (_key: string) => {
        setPlayingVideoIndex(null);
    };

    return { tabItems: items, onTabChange };
};
