import ReviewPayment from '@components/molecular/review-payment/pages/PaymentScreen';
import { useAppSelector } from '@src/hooks/store';

import PaymentStatusPage from './PaymentStatusPage';
import useHandlePayment from '../hooks/useHandlePayment';
import useWalletApi from '../hooks/useWalletApi';
import { summaryTexts } from '../types/types';

const PaymentPage = () => {
    const { walletData } = useWalletApi();
   
    const addressData = useAppSelector(state => state.reducer.giftcardCheckout.addressDetails);
    const itemData = useAppSelector(state => state.reducer.giftcardCheckout.itemDetails);
    const { handleSubmit, paymentSuccessful } = useHandlePayment();

    const billSummaryArray: summaryTexts[] = [
        { key: 'Service Name', value: 'GiftCards' },
        { key: 'Company', value: 'eResolute (P) Ltd' },
        { key: 'Amount ', value: itemData.total_selling_price.toString() },
    ];

    const paymentSummary: summaryTexts[] = [
        {
            key: 'Convience Fee',
            // value: surchargeData?.serviceData.cashback,
            value: '0',
        },
        {
            key: 'Taxs and Fees',
            value: '0',
        },
        {
            key: 'Cashback You will Earn',
            value: '0',
        },
    ];

   
    if (paymentSuccessful) {
        return <PaymentStatusPage paymentStatus={paymentSuccessful} />;
    }

    // Render the payment form if payment was not successful or if payment status is not determined yet
    return (
        <ReviewPayment
            billSummaryArray={billSummaryArray}
            paymentFunction={() =>
                handleSubmit({ ...itemData, ...addressData, txtId: '2305011234043050' })
            }
            totalAmount={itemData.total_selling_price}
            cashbackBalance={walletData?.balance}
            paymentSummaryArray={paymentSummary}
            title="Bill Summary"
        />
    );
};

export default PaymentPage;
