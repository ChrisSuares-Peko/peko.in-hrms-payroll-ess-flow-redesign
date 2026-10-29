import { useAppSelector } from '@src/hooks/hooks';

import CartList from '../components/cart/CartList';
import OfficeSuppliesTop from '../components/OfficeSuppliesTop';

function CartPage() {
    const count = useAppSelector(state => state.reducer.cart.count);

    return (
        <>
            <OfficeSuppliesTop
                title="Shopping cart"
                subtitle={count > 0 ? `${count} ${count === 1 ? 'item' : 'items'}` : ''}
            />
            <CartList />
        </>
    );
}

export default CartPage;
