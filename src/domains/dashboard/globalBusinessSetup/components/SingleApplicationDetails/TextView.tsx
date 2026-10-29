import type { HTMLAttributes, ReactNode } from 'react';

import { twMerge } from 'tailwind-merge';

type TextViewProps = {
    text: string | ReactNode;
    fallback?: string;
    className?: HTMLAttributes<HTMLSpanElement>['className'];
};

export default function TextView({ text, className, fallback = '-' }: TextViewProps) {
    const isEmpty =
        text === null || text === undefined || (typeof text === 'string' && text.trim() === '');

    if (isEmpty) {
        return (
            <span
                className={twMerge(
                    'whitespace-normal break-words text-default-500 italic',
                    className
                )}
            >
                {fallback}
            </span>
        );
    }

    return <span className={twMerge('line-clamp-2 break-words', className)}>{text}</span>;
}
