import { formatNumberWithLocalString } from '@utils/priceFormat';

import PaymentMethodRow from './PaymentMethodRow';
import { CorporateCardPaymentOption, PaymentMode } from '../../payments/types/index';
import { corporateCardBlockingReason } from '../../payments/utils/corporateCardReason';
import cardIcon from '../assets/images/card-payment.png';

interface CorporateCardRowProps {
    option: CorporateCardPaymentOption;
    totalAmount: number;
    selectedPayment: PaymentMode;
    isLoading: boolean;
    onSelect: () => void;
}

// The cardholder's own Pine Labs card as a payment instrument. The issuer line is a compliance requirement.
const CorporateCardRow = ({
    option,
    totalAmount,
    selectedPayment,
    isLoading,
    onSelect,
}: CorporateCardRowProps) => {
    const reason = corporateCardBlockingReason(option, totalAmount);
    const { card } = option;
    const remaining = card?.remaining ?? null;

    return (
        <>
            <PaymentMethodRow
                label={card?.last4 ? `Corporate Card •••• ${card.last4}` : 'Corporate Card'}
                icon={cardIcon}
                amount={remaining === null ? undefined : formatNumberWithLocalString(remaining)}
                badge={
                    remaining === null
                        ? 'Issued by Pine Labs'
                        : 'Issued by Pine Labs · limit left this period'
                }
                checked={selectedPayment === PaymentMode.corporateCard}
                disabled={!!reason || isLoading}
                handleSelection={onSelect}
            />
            {reason && (
                <div className="rounded-xl bg-[#fffbeb] p-3.5">
                    <span className="text-xs text-[#92400e] sm:text-sm">{reason}</span>
                </div>
            )}
        </>
    );
};

export default CorporateCardRow;
