import { Flex, Skeleton } from 'antd';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

import FeatureItems from './FeatureItems';
import ContentHeadAndBody from '../ContentHeadAndBody';

const FeaturesTab = () => {
    const { product, isLoading } = useProductContext();
    if (isLoading) return <Skeleton />;
    if (!product) return null;

    return (
        <Flex vertical className="w-full  min-h-96">
            {product.feature_overview && (
                <ContentHeadAndBody
                    header="Feature Overview"
                    textContent={product.feature_overview}
                />
            )}

            {product.features && product.features.length > 0 && (
                <ContentHeadAndBody header="Features" textContent={null}>
                    <FeatureItems indicator="feature" />
                </ContentHeadAndBody>
            )}

            {product.other_features && product.other_features.length > 0 && (
                <ContentHeadAndBody header="Other Features" textContent={null}>
                    <FeatureItems indicator="other feature" />
                </ContentHeadAndBody>
            )}
        </Flex>
    );
};

export default FeaturesTab;
