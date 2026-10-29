import type { summaryTexts } from '@customtypes/general';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import BillSummaryRow from './BillSummaryRow';
import CancelAndBack from './CancelAndBack';
import shieldCheckIcon from '../assets/svg/shield-check.svg';

interface PaymentSummaryCardProps {
    paymentSummary: summaryTexts[];
    totalAmount: number;
    payLabel: string;
    isPayDisabled: boolean;
    isLoading: boolean;
    onPay: () => void;
}

const PaymentSummaryCard = ({
    paymentSummary,
    totalAmount,
    payLabel,
    isPayDisabled,
    isLoading,
    onPay,
}: PaymentSummaryCardProps) => (
    <div className="w-full rounded-2xl bg-white p-6 shadow-[0_1.5px_8.25px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-bold text-slate-900">Payment summary</h2>
        <hr className="my-5 border-slate-200" />
        <div className="flex flex-col gap-5">
            {paymentSummary.map(item => (
                <BillSummaryRow key={item.key} headName={item.key} value={item.value} />
            ))}
        </div>
        <hr className="my-5 border-slate-200" />
        <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-base font-bold text-slate-900">Amount Payable</span>
            <span className="shrink-0 whitespace-nowrap text-base font-extrabold text-slate-800">
                ₹ {formatNumberWithLocalString(totalAmount || 0)}
            </span>
        </div>
        <button
            type="button"
            onClick={onPay}
            disabled={isPayDisabled || isLoading}
            className="mt-5 flex h-[43px] w-full items-center justify-center rounded-lg bg-lightRed px-4 text-base font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:opacity-100"
        >
            {isLoading ? (
                <span
                    className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none"
                    aria-hidden="true"
                />
            ) : (
                payLabel
            )}
        </button>
        <CancelAndBack variant="link" className="mt-4" />
        <div className="mt-4 flex items-center justify-center gap-2">
            <img src={shieldCheckIcon} alt="" className="h-4 w-4" />
            <span className="text-center text-xs text-slate-500">3D Secure Authentication</span>
        </div>
    </div>
);

export default PaymentSummaryCard;
