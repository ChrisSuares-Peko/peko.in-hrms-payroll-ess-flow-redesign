import type { FC, ReactNode } from 'react';

import { Typography } from 'antd';

const { Text } = Typography;

/** White card shared by every block on the Rules tab. */
const RuleSection: FC<{
    title: string;
    count?: ReactNode;
    description?: ReactNode;
    extra?: ReactNode;
    children?: ReactNode;
}> = ({ title, count, description, extra, children }) => (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-[560px]">
                <Text className="text-[14px] font-semibold text-[#101828]">
                    {title}
                    {count !== undefined && (
                        <span className="ml-2 font-normal text-[#667085]">{count}</span>
                    )}
                </Text>
                {description && (
                    <div className="mt-1 text-[12px] leading-[18px] text-[#667085]">
                        {description}
                    </div>
                )}
            </div>
            {extra && <div className="flex shrink-0 flex-wrap items-center gap-2">{extra}</div>}
        </div>
        {children && <div className="mt-4">{children}</div>}
    </section>
);

export default RuleSection;

/** Small grey "Hiding N products" style pill in a section header. */
export const CountPill: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="whitespace-nowrap rounded-full bg-[#F2F4F7] px-3 py-1 text-[11px] font-medium text-[#475467]">
        {children}
    </span>
);

/** Inline "History" link that opens the section's history drawer. */
export const HistoryLink: FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="cursor-pointer border-none bg-transparent p-0 text-[12px] text-[#475467] underline-offset-2 hover:text-[#101828] hover:underline"
    >
        History
    </button>
);

/** Grey "Changed 3 days ago by Peko Admin · History" footer line. */
export const ChangeMeta: FC<{ text: ReactNode; onHistory: () => void }> = ({ text, onHistory }) => (
    <span className="text-[12px] text-[#667085]">
        {text} · <HistoryLink onClick={onHistory} />
    </span>
);
