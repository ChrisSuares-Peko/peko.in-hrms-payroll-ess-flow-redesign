import { Flex } from 'antd';

import Header from './header';
import TabNavigator from './TabNavigator';

const ProductDetails = () => (
    <Flex
        vertical
        justify="flex-start"
        className="w-full xl:w-[70%] xl:min-w-[70%] gap-3 p-9  bg-white rounded-3xl shadow-[0px_2.01px_20.12px_0px_#0000000D] border"
    >
        <Header />
        <TabNavigator />
    </Flex>
);

export default ProductDetails;
