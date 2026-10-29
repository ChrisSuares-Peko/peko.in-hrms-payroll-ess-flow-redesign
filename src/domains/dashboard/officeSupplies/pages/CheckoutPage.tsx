import CheckoutList from '../components/checkout/CheckoutList';
import OfficeSuppliesTop from '../components/OfficeSuppliesTop';

function CheckoutPage() {
    return (
        <>
            <OfficeSuppliesTop title="Checkout" subtitle="" />
            <CheckoutList />
        </>
    );
}

export default CheckoutPage;
