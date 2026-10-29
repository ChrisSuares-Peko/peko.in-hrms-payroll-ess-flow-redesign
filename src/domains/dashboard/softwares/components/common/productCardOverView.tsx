import { Flex, Typography } from 'antd';

import useProductCard from '../../hooks/general/useProductCard';
import { IProductCard } from '../../types';

const { Paragraph } = Typography;

type Props = {
    text: string;
    product: IProductCard;
};

const ProductCardOverView = ({ text, product }: Props) => {
    const { routeToProductPage } = useProductCard(product);

    return (
        <Flex className="w-full">
            <Paragraph className="text-sm mb-0">
                <span className="line-clamp-3">{text}</span>

                <button
                    type="button"
                    onClick={() => routeToProductPage(product.weburl)}
                    className="font-medium text-fontSubHeader ml-1 bg-transparent border-none p-0 cursor-pointer"
                >
                    Read More
                </button>
            </Paragraph>
        </Flex>
    );
};

export default ProductCardOverView;
