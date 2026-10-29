import type { FC } from 'react';

import { Flex, Image } from 'antd';

import CartIcon from '../assets/icons/cart-icon.png';

interface ShoppingCartIconProps {}

const ShoppingCartIcon: FC<ShoppingCartIconProps> = () => (
    <Flex style={{ marginLeft: '5px', display: 'flex', gap: 6 }}>
        <Image
            className="xs:hidden md:flex hover:fill-red"
            src={CartIcon}
            preview={false}
            width={26}
        />
        <Flex style={{ marginLeft: '5px', fontSize: '16px', fontWeight: 'bold' }}>Cart</Flex>
    </Flex>
);

export default ShoppingCartIcon;
