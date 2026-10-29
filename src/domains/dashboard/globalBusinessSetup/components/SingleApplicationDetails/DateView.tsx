import type { HTMLAttributes } from 'react';

import { twMerge } from 'tailwind-merge';

import { formattedDateOnly } from '@utils/dateFormat';

import calendarIcon from '../../assets/svg/calendar.svg';

type DateViewProps = {
    date: Date | string | null | undefined;
    className?: HTMLAttributes<HTMLDivElement>['className'];
};

export default function DateView({ date, className }: DateViewProps) {
    const parsed = date ? new Date(date) : null;
    const isValid = parsed && !Number.isNaN(parsed.getTime());
    return (
        <div className={twMerge('flex items-center gap-2', className)}>
            <img
                src={calendarIcon}
                alt="calendar icon"
                className="flex-shrink-0"
                width={16}
                height={16}
            />
            <span className="whitespace-nowrap">
                {isValid ? formattedDateOnly(parsed) : 'N/A'}
            </span>
        </div>
    );
}
