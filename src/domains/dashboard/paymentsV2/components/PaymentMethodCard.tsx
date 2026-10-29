// import cashfreeLogo from '@assets/images/cashfreeLogo.png';
// import ccAvenueLogo from '@assets/images/ccAvenueLogo.png';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CorporateCardRow from './CorporateCardRow';
import PaymentMethodRow from './PaymentMethodRow';
import pluralLogo from '../../payments/assets/images/pluralLogo.png';
import pekoLogo from '../../payments/assets/svg/peko-logo.svg';
import walletIcon from '../../payments/assets/svg/wallet.svg';
import { CorporateCardPaymentOption, PaymentMode } from '../../payments/types/index';
import cardIcon from '../assets/images/card-payment.png';

interface PaymentMethodCardProps {
    showCorporateCardOption: boolean;
    corporateCardOption?: CorporateCardPaymentOption;
    totalAmount: number;
    onSelectCorporateCard: () => void;
    showWalletPaymentOptions: boolean;
    walletBalance: number;
    isWalletDisabled: boolean;
    isWalletLoading: boolean;
    showPluralOption: boolean;
    showGatewayOption: boolean;
    showMswipeOption: boolean;
    isCCavenue: boolean;
    isPluralDisabled: boolean;
    selectedPayment: PaymentMode;
    onSelectWallet: () => void;
    onSelectPlural: () => void;
    onSelectGateway: () => void;
    onSelectMswipe: () => void;
    onAddFunds: () => void;
    isLoading: boolean;
}

const PaymentRowSkeleton = () => (
    <div
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3.5"
        aria-hidden="true"
    >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center">
            <div className="h-[26px] w-[26px] shrink-0 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        </span>
        <div className="h-3.5 w-40 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
    </div>
);

const PaymentMethodCard = ({
    showCorporateCardOption,
    corporateCardOption,
    totalAmount,
    onSelectCorporateCard,
    showWalletPaymentOptions,
    walletBalance,
    isWalletDisabled,
    isWalletLoading,
    showPluralOption,
    showGatewayOption,
    showMswipeOption,
    isCCavenue,
    isPluralDisabled,
    selectedPayment,
    onSelectWallet,
    onSelectPlural,
    onSelectGateway,
    onSelectMswipe,
    onAddFunds,
    isLoading,
}: PaymentMethodCardProps) => (
    <div className="w-full rounded-2xl bg-white p-6 shadow-[0_1.5px_8.25px_rgba(0,0,0,0.06)]">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Select Payment Method</h2>
        <div className="flex flex-col gap-3.5">
            {showWalletPaymentOptions && isWalletLoading && <PaymentRowSkeleton />}
            {showWalletPaymentOptions && !isWalletLoading && (
                <>
                    <PaymentMethodRow
                        label="Peko Wallet"
                        icon={walletIcon}
                        amount={formatNumberWithLocalString(walletBalance)}
                        brandLogo={pekoLogo}
                        checked={selectedPayment === PaymentMode.wallet}
                        disabled={isWalletDisabled || isLoading}
                        handleSelection={onSelectWallet}
                    />
                    {isWalletDisabled && (
                        <div className="flex flex-col gap-3 rounded-xl bg-[#fffbeb] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs text-[#92400e] sm:text-sm">
                                Insufficient wallet balance. Please add funds to proceed.
                            </span>
                            <button
                                type="button"
                                onClick={onAddFunds}
                                className="shrink-0 rounded-lg border border-brandColor bg-white px-3 py-1.5 text-xs font-medium text-brandColor transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed focus-visible:ring-offset-2 sm:text-sm"
                            >
                                Add Funds
                            </button>
                        </div>
                    )}
                </>
            )}

            {showCorporateCardOption && corporateCardOption && (
                <CorporateCardRow
                    option={corporateCardOption}
                    totalAmount={totalAmount}
                    selectedPayment={selectedPayment}
                    isLoading={isLoading}
                    onSelect={onSelectCorporateCard}
                />
            )}

            {showPluralOption && (
                <PaymentMethodRow
                    label="Debit/Credit/UPI/Net Banking"
                    icon={cardIcon}
                    brandLogo={pluralLogo}
                    checked={selectedPayment === PaymentMode.card}
                    disabled={isPluralDisabled || isLoading}
                    handleSelection={onSelectPlural}
                />
            )}

            {showGatewayOption && (
                <PaymentMethodRow
                    label="BHIM/UPI/Credit Card/Debit Card/Bank Account"
                    icon={cardIcon}
                    // brandLogo={isCCavenue ? ccAvenueLogo : cashfreeLogo}
                    checked={
                        selectedPayment === (isCCavenue ? PaymentMode.CCAVENUE : PaymentMode.PAYTM)
                    }
                    disabled={isLoading}
                    handleSelection={onSelectGateway}
                />
            )}

            {showMswipeOption && (
                <PaymentMethodRow
                    label="UPI/Credit Card/Debit Card"
                    icon={cardIcon}
                    checked={selectedPayment === PaymentMode.MSWIPE}
                    disabled={isLoading}
                    handleSelection={onSelectMswipe}
                />
            )}
        </div>
    </div>
);

export default PaymentMethodCard;
