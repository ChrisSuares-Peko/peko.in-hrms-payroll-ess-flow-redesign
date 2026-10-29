import { ReactNode } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { FaqScreen, findFaqEntry, findFaqEntryById } from './accountingFaq';
import { LEDGER_TAB_LABELS, LedgerTabKey } from '../config/ledgerPaths';
import { accountingLeafPath } from '../config/servicePaths';

export const FAQ_PATH = accountingLeafPath(paths.accountingAdmin.faq);

export const faqAnchorPath = (id: string) => `${FAQ_PATH}#${id}`;

export const faqTabOf = (tab: LedgerTabKey) => LEDGER_TAB_LABELS[tab];

export const FaqHint = ({ id }: { id: string }) => {
    const item = findFaqEntryById(id);
    if (!item) return null;

    return (
        <Tooltip title={`${item.question} ${item.answer}`}>
            <Link
                to={faqAnchorPath(id)}
                aria-label={`How is ${item.label} calculated?`}
                className="ml-1 !text-muted hover:!text-textHeadings"
                onClick={event => event.stopPropagation()}
            >
                <InfoCircleOutlined className="text-xs" />
            </Link>
        </Tooltip>
    );
};

export const faqHint = (screen: FaqScreen, tab: string, label: string): ReactNode => {
    const item = findFaqEntry(screen, tab, label);
    return item ? <FaqHint id={item.id} /> : null;
};

export const withFaqTitles = <T extends readonly { title?: unknown }[]>(
    columns: T,
    screen: FaqScreen,
    tab: string
): T =>
    columns.map(column => {
        if (typeof column.title !== 'string') return column;
        const hint = faqHint(screen, tab, column.title);
        if (!hint) return column;
        return {
            ...column,
            title: (
                <span>
                    {column.title}
                    {hint}
                </span>
            ),
        };
    }) as unknown as T;
