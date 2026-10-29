import { Flex, Skeleton } from 'antd';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

import Languages from './Languages';
import ParentCategories from './ParentCategories';
import SocialLinks from './SocialLinks';
import VideoPlayer from './VideoPlayer';
import ContentHeadAndBody from '../ContentHeadAndBody';

const OverViewTab = () => {
    const { product, isLoading } = useProductContext();
    if (isLoading) return <Skeleton />;
    if (!product) return null;

    return (
        <Flex vertical className="w-full min-h-96">
            {product.overview && (
                <ContentHeadAndBody header="Details" textContent={product.overview} />
            )}
            {product?.videos && product.videos.length > 0 && (
                <ContentHeadAndBody header="Product Demo" textContent={null}>
                    <VideoPlayer />
                </ContentHeadAndBody>
            )}

            {product.usp && (
                <ContentHeadAndBody
                    header="USP (Unique Selling Proposition)"
                    textContent={product.usp}
                />
            )}

            {Object.keys(product?.social_links).length > 0 && (
                <ContentHeadAndBody header="Social Links" textContent={null}>
                    <SocialLinks />
                </ContentHeadAndBody>
            )}

            {product?.parent_categories && (
                <ContentHeadAndBody header="Parent Categories" textContent={null}>
                    <ParentCategories />
                </ContentHeadAndBody>
            )}

            {product?.languages && (
                <ContentHeadAndBody header="Languages" textContent={null}>
                    <Languages />
                </ContentHeadAndBody>
            )}
        </Flex>
    );
};

export default OverViewTab;
