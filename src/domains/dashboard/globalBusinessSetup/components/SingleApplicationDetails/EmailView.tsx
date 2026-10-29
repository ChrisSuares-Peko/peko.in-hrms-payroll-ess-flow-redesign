import type { HTMLAttributes } from 'react';

import { twMerge } from 'tailwind-merge';

import emailIcon from '../../assets/svg/email_icon.svg';

type EmailViewProps = {
    email: string;
    className?: HTMLAttributes<HTMLDivElement>['className'];
    fallback?: string;
};

export default function EmailView({ email, className, fallback = '-' }: EmailViewProps) {
    const isEmpty = !email || (typeof email === 'string' && email.trim() === '');

    if (isEmpty) {
        return (
            <div className={twMerge('flex items-center gap-2 text-default-500 italic', className)}>
                <img
                    src={emailIcon}
                    alt="email"
                    className="flex-shrink-0 opacity-60"
                    width={18}
                    height={18}
                />
                <span>{fallback}</span>
            </div>
        );
    }

    return (
        <div className={twMerge('flex items-center gap-2', className)}>
            <img src={emailIcon} alt="email" className="flex-shrink-0" width={18} height={18} />

            <a
                className="truncate text-primary hover:underline"
                href={`mailto:${email}`}
                title={email}
            >
                {email}
            </a>
        </div>
    );
}
