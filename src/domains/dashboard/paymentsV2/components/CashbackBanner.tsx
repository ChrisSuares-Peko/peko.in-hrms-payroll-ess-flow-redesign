import { formatNumberWithLocalString } from '@utils/priceFormat';

import cashbackIcon from '../assets/images/cashback-hand.png';

interface CashbackBannerProps {
    amount: number;
}

const CashbackBanner = ({ amount }: CashbackBannerProps) => (
    <div className="flex w-full items-center gap-4 rounded-xl border border-[#7ccca5] bg-[#f5fffa] p-3.5 sm:gap-5">
        <img src={cashbackIcon} alt="" className="h-9 w-auto shrink-0 sm:h-10" />
        <p className="text-sm leading-relaxed text-[#005d39]">
            Congratulations! You will get a cashback of ₹ {formatNumberWithLocalString(amount)}
        </p>
    </div>
);

export default CashbackBanner;
