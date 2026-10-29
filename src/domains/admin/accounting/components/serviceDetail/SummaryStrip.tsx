import { ReactNode } from 'react';

import { Typography } from 'antd';

import { FaqScreen } from '../../faq/accountingFaq';
import { faqHint } from '../../faq/FaqHint';

export type SummaryItem = {
    label: string;
    value: ReactNode;
    tone?: 'default' | 'warning';
    labelClassName?: string;
};

export type SummaryFaq = { screen: FaqScreen; tab: string };

const SummaryStrip = ({
    items,
    footnote,
    faq,
    distribution = 'equal',
}: {
    items: SummaryItem[];
    footnote?: ReactNode;
    faq?: SummaryFaq;
    distribution?: 'equal' | 'space-between';
}) => (
    <div className="rounded-xl border border-solid border-borderCard bg-[#F8FAFC]">
        <div
            className={
                distribution === 'space-between'
                    ? 'flex flex-wrap justify-between'
                    : 'grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))]'
            }
        >
            {items.map(item => (
                <div
                    key={item.label}
                    className={`${distribution === 'space-between' ? 'flex-none' : ''} px-5 py-4`}
                >
                    <Typography.Text
                        className={`block text-[11px] uppercase tracking-wide text-textBody ${item.labelClassName ?? ''}`}
                    >
                        {item.label}
                        {faq ? faqHint(faq.screen, faq.tab, item.label) : null}
                    </Typography.Text>
                    <Typography.Text
                        className={`mt-1.5 block text-base font-semibold ${item.tone === 'warning' ? 'text-amber-700' : 'text-textHeadings'}`}
                    >
                        {item.value}
                    </Typography.Text>
                </div>
            ))}
        </div>
        {footnote ? (
            <div className="border-0 border-t border-solid border-borderCard px-5 py-2.5">
                <Typography.Text className="text-xs text-textBody">{footnote}</Typography.Text>
            </div>
        ) : null}
    </div>
);

export default SummaryStrip;
