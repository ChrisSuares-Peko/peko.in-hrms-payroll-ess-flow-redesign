import { Image } from 'antd';

import BharathConnect from '@src/domains/dashboard/billPayments/assets/svg/BharatConnect.svg';

import { checkIsBBPS } from '../../payments/utils/utils';

interface PaymentHeaderProps {
    accessKeyName?: string;
}

const PaymentHeader = ({ accessKeyName }: PaymentHeaderProps) => (
    <div className="flex items-center justify-center gap-3">
        <h1 className="text-center text-lg font-bold capitalize text-slate-900">
            Review your payment
        </h1>
        {accessKeyName && checkIsBBPS(accessKeyName) && (
            <Image src={BharathConnect} width={90} preview={false} />
        )}
    </div>
);

export default PaymentHeader;
