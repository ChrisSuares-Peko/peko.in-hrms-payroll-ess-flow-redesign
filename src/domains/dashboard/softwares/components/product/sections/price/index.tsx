import { Button, Flex, Typography } from 'antd';
// import { PopupModal } from 'react-calendly';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

import ProductPriceCardSkeleton from '../../../common/skeletons/product/ProductPriceCardSkeleton';

const { Text } = Typography;

const Price = () => {
    const { product, isLoading, routeToNextPage, getAssistanceIsLoading } = useProductContext();
    if (isLoading) return <ProductPriceCardSkeleton />;
    if (!product) return null;
    const { hasPurchaseOptions } = product;
    const { pricing } = product;
    let buttonTxt = '';
    if (hasPurchaseOptions || pricing.length > 0) {
        buttonTxt = 'View Plans';
    } else {
        buttonTxt = 'Request for Quote';
    }
    return (
        <Flex
            vertical
            className="justify-start gap-7 w-full shadow-[0px_2.01px_20.12px_0px_#0000000D] p-9 rounded-xl border max-h-fit"
        >
            <Flex vertical className="w-full gap-1">
                <Text className="font-semibold text-lg text-[#101828]">Price Breakdown</Text>
                <Text className="font-regular text-sm text-[#4A5565] opacity-80">
                    Multiple pricing plans available
                </Text>
            </Flex>

            <Flex vertical className="justify-center gap-2">
                <Button
                    type="primary"
                    className="w-full h-11 rounded-lg font-medium text-base "
                    danger
                    loading={!hasPurchaseOptions ? getAssistanceIsLoading : false}
                    onClick={() => {
                        routeToNextPage();
                        //        if (hasPurchaseOptions) {
                        //     routeToNextPage();
                        // } else {
                        //     setCalendlyOpen(true);
                        // }
                    }}
                >
                    {buttonTxt}
                </Button>
                <Text className="font-medium text-xs text-[#4A5565] text-center opacity-90">
                    Our expets will help you find the best plan
                </Text>
            </Flex>

            {/* {calendlyOpen && (
                <PopupModal
                    url={product.calendlyLink}
                    rootElement={document.body}
                    open={calendlyOpen}
                    onModalClose={() => setCalendlyOpen(false)}
                />
            )} */}
        </Flex>
    );
};

export default Price;
