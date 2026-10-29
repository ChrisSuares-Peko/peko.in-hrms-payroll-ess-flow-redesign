import type { FC } from 'react';

import { Avatar, Button, Flex, Image, InputNumber, Typography } from 'antd';

import cashBack from '@assets/icons/ExtraCashback.svg';
import saveFlat from '@assets/icons/SaveFlat.svg';
import { formatNumberWithLocalString } from '@utils/priceFormat';

interface ProductDescriptionLgProps {
    id: number;
    colors?: string[];
    price: string;
    actualPrice: string;
    quantity: number;
    savePrice?: string;
    addToCartLoading: boolean;
    cartUpdateQuantity: number;
    handleUpdateQuantity: (newQuantity: number) => void;
    handleAddToCart: (productId: number) => void;
    buyProducts: (productId: number) => void;
}
const { Text } = Typography;

const ProductDescriptionLg: FC<ProductDescriptionLgProps> = ({
    id,
    savePrice,
    price,
    actualPrice,
    quantity,
    colors,
    addToCartLoading,
    cartUpdateQuantity,
    handleUpdateQuantity,
    handleAddToCart,
    buyProducts,
}) => {
    const save = (parseFloat(actualPrice) - parseFloat(price)).toFixed(2);
    const formattedPrice = formatNumberWithLocalString(actualPrice);

    return (
        <>
            <Flex vertical className="mt-3 hidden">
                <Text strong className="font-roboto text-gray-400 text-xs font-light">
                    Select your color:{' '}
                </Text>
                <Flex gap={5} align="center" className="mt-4">
                    {colors &&
                        colors.map((color, index) => (
                            <Avatar key={index} style={{ backgroundColor: color }} size={25} />
                        ))}
                </Flex>
            </Flex>

            <Flex gap={20} vertical>
                <Flex gap={30} justify="start" align="center" className="mx-0 mt-5">
                    {parseFloat(save) > 0 && (
                        <Flex justify="center" align="center" gap={10}>
                            <Image preview={false} src={saveFlat} alt="Save flat icon" />
                            <Text className="text-textDimGreen text-base">
                                Save AED {formatNumberWithLocalString(save)}
                            </Text>
                        </Flex>
                    )}
                    <Flex justify="center" align="center" gap={10}>
                        <Image preview={false} src={cashBack} alt="Earn Cashback" />
                        <Text className="text-textDimGreen font-roboto text-base">
                            Earn Cashback
                        </Text>
                    </Flex>
                </Flex>
            </Flex>
            <Flex gap={5} vertical className="mt-5">
                <Flex gap={15} align="baseline" className="mx-0">
                    <Text className="text-neutral-950 text-2xl font-medium">
                        AED {formatNumberWithLocalString(price)}
                    </Text>
                    {actualPrice !== price && (
                        <Text className="text-productText text-base">
                            Real price
                            <Text delete className="text-productText text-base strike ms-2">
                                AED {formattedPrice}
                            </Text>
                        </Text>
                    )}
                </Flex>

                <Text className="text-productText text-base font-normal">Inclusive of VAT</Text>
            </Flex>
            <Flex gap={15} vertical className="mt-5">
                <Text className="text-textBlack text-base font-normal">
                    This item will be delivered within 2 to 4 working days with standard delivery
                    charge.
                </Text>
                <Flex gap={10} className="m-0 p-0">
                    <InputNumber
                        type="number"
                        min={1}
                        max={quantity || 10}
                        defaultValue={cartUpdateQuantity}
                        onChange={value => handleUpdateQuantity(value!)}
                        className="border"
                        size="large"
                    />
                    {quantity < 1 ? (
                        <div
                            key="outOfStock"
                            className="text-bgOrange h-10 border border-bgOrange bg-white rounded-sm w-24 px-0 flex items-center justify-center"
                            style={{ pointerEvents: 'none' }} // Prevent any interactions
                        >
                            Out of Stock
                        </div>
                    ) : (
                        <Button
                            loading={addToCartLoading}
                            key="addToCart"
                            className="text-bgOrange p-2 "
                            disabled={quantity < 1}
                            onClick={() => handleAddToCart(id!)}
                            size="large"
                        >
                            Add to Cart
                        </Button>
                    )}

                    {quantity > 1 && (
                        <Button
                            type="primary"
                            danger
                            size="large"
                            className="px-8 py-2 p-2"
                            disabled={quantity < 1}
                            onClick={() => {
                                buyProducts(id);
                            }}
                        >
                            Buy Now
                        </Button>
                    )}
                </Flex>
            </Flex>
        </>
    );
};

export default ProductDescriptionLg;
