import { Image } from 'antd';
import { twMerge } from 'tailwind-merge';

import callIcon from '../../assets/svg/call.svg';

type PhoneViewProps = {
    phone: string;
    className?: string;
    showIcon?: boolean;
};

export default function PhoneView({ phone, className, showIcon = true }: PhoneViewProps) {
    const formatted = phone?.startsWith('+') ? phone : `+${phone}`;

    return (
        <div className={twMerge('flex items-center gap-2', className)}>
            {showIcon && (
                <Image
                    src={callIcon}
                    alt="phone"
                    className="flex-shrink-0"
                    width={18}
                    height={18}
                    preview={false}
                />
            )}
            <a href={`tel:${formatted}`} className="text-primary hover:underline">
                {formatted || 'N/A'}
            </a>
        </div>
    );
}
