import { useEffect, useMemo, useRef, useState } from 'react';

import { Collapse, Input, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link, useLocation } from 'react-router-dom';

import PageTabs from '@src/domains/dashboard/corporateCards/components/common/PageTabs';

import { FAQ_ENTRIES, FAQ_SCREENS, FaqEntry, findFaqEntryById } from '../faq/accountingFaq';
import { FAQ_CONCEPTS, FaqConcept, findFaqConcept } from '../faq/faqConcepts';
import { faqAnchorPath } from '../faq/FaqHint';

export const FAQ_INTRO =
    'Every figure in this portal, where it comes from and how it is worked out. Each entry names the screen it is on, the calculation behind it, and what the cell shows when the figure could not be worked out.';

export const CONCEPTS_TAB = 'concepts';

const PANE_CLASS = 'mt-4 overflow-y-auto pr-2 max-h-[calc(100vh-340px)] min-h-[320px]';

const tabOfTarget = (id: string): string | null => {
    const item = findFaqEntryById(id);
    if (item) return item.screen;
    return FAQ_CONCEPTS.some(concept => concept.id === id) ? CONCEPTS_TAB : null;
};

const scrollPane = (pane: HTMLElement, top: number) => {
    if (typeof pane.scrollTo === 'function') pane.scrollTo({ top, behavior: 'smooth' });
};

const scrollPaneTo = (pane: HTMLElement, target: HTMLElement) =>
    scrollPane(
        pane,
        target.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - 8
    );

const matches = (haystack: string[], needle: string) =>
    haystack.some(text => text.toLowerCase().includes(needle));

export const filterEntries = (entries: FaqEntry[], search: string) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter(item =>
        matches([item.label, item.question, item.answer, item.formula || '', item.tab], needle)
    );
};

export const filterConcepts = (concepts: FaqConcept[], search: string) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return concepts;
    return concepts.filter(item => matches([item.title, item.summary, ...item.body], needle));
};

const ConceptLinks = ({ ids }: { ids: FaqEntry['concepts'] }) => {
    const concepts = ids.map(findFaqConcept).filter(Boolean) as FaqConcept[];
    if (!concepts.length) return null;
    return (
        <Typography.Paragraph className="!mb-1 text-[13px]">
            Read with:{' '}
            {concepts.map((concept, index) => (
                <span key={concept.id}>
                    {index > 0 ? ' · ' : ''}
                    <Link to={faqAnchorPath(concept.id)}>{concept.title}</Link>
                </span>
            ))}
        </Typography.Paragraph>
    );
};

const EntryBody = ({ item }: { item: FaqEntry }) => (
    <div className="text-[13px] text-textBody">
        <Typography.Paragraph strong className="!mb-1">
            {item.question}
        </Typography.Paragraph>
        <Typography.Paragraph className="!mb-2">{item.answer}</Typography.Paragraph>
        {item.formula ? (
            <Typography.Paragraph className="!mb-2">
                <Typography.Text strong>How it is worked out: </Typography.Text>
                {item.formula}
            </Typography.Paragraph>
        ) : null}
        <Typography.Paragraph className="!mb-2">
            <Typography.Text strong>When it cannot be worked out: </Typography.Text>
            {item.whenMissing}
        </Typography.Paragraph>
        <ConceptLinks ids={item.concepts} />
        <Typography.Text className="text-xs text-navTextColor">
            Last reviewed {item.lastReviewed}
        </Typography.Text>
    </div>
);

const ConceptBody = ({ item }: { item: FaqConcept }) => (
    <div className="text-[13px] text-textBody">
        <Typography.Paragraph className="!mb-2">{item.summary}</Typography.Paragraph>
        {item.body.map(paragraph => (
            <Typography.Paragraph key={paragraph} className="!mb-2">
                {paragraph}
            </Typography.Paragraph>
        ))}
        <Typography.Text className="text-xs text-navTextColor">
            Last reviewed {item.lastReviewed}
        </Typography.Text>
    </div>
);

const groupByTab = (entries: FaqEntry[]) => {
    const groups = new Map<string, FaqEntry[]>();
    entries.forEach(item => {
        const list = groups.get(item.tab) || [];
        list.push(item);
        groups.set(item.tab, list);
    });
    return Array.from(groups.entries());
};

const AccountingFaq = () => {
    const { hash } = useLocation();
    const paneRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState('');
    const [selectedTab, setSelectedTab] = useState(CONCEPTS_TAB);
    const [activeKeys, setActiveKeys] = useState<string[]>([]);

    const targetId = hash.replace(/^#/, '');

    useEffect(() => {
        const tab = targetId ? tabOfTarget(targetId) : null;
        if (!tab) return undefined;
        setSelectedTab(tab);
        setActiveKeys(keys => (keys.includes(targetId) ? keys : [...keys, targetId]));
        const timer = window.setTimeout(() => {
            const target = document.getElementById(targetId);
            if (target && paneRef.current) scrollPaneTo(paneRef.current, target);
        }, 80);
        return () => window.clearTimeout(timer);
    }, [targetId]);

    const entries = useMemo(() => filterEntries(FAQ_ENTRIES, search), [search]);
    const concepts = useMemo(() => filterConcepts(FAQ_CONCEPTS, search), [search]);
    const screens = FAQ_SCREENS.filter(screen => entries.some(item => item.screen === screen));

    const tabs = [
        ...(concepts.length ? [{ key: CONCEPTS_TAB, label: 'Concepts' }] : []),
        ...screens.map(screen => ({ key: screen, label: screen })),
    ];
    const activeTab = tabs.some(tab => tab.key === selectedTab) ? selectedTab : tabs[0]?.key;

    const onTabChange = (key: string) => {
        setSelectedTab(key);
        if (paneRef.current) scrollPane(paneRef.current, 0);
    };

    const onGroupChange = (groupIds: string[]) => (keys: string | string[]) => {
        const opened = Array.isArray(keys) ? keys : [keys];
        setActiveKeys(current => [...current.filter(key => !groupIds.includes(key)), ...opened]);
    };

    return (
        <Content>
            <Typography.Title level={3} className="!mb-1 !text-textHeadings">
                How the numbers are calculated
            </Typography.Title>
            <Typography.Paragraph className="!mb-4 text-[13px] text-textBody">
                {FAQ_INTRO}
            </Typography.Paragraph>
            <Input.Search
                allowClear
                placeholder="Search a figure, a column or a word from an answer"
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="max-w-xl mb-4"
            />

            {tabs.length ? (
                <>
                    <PageTabs tabs={tabs} activeKey={activeTab || ''} onChange={onTabChange} />
                    <div ref={paneRef} className={PANE_CLASS}>
                        {activeTab === CONCEPTS_TAB ? (
                            <Collapse
                                activeKey={activeKeys}
                                onChange={onGroupChange(concepts.map(item => item.id))}
                                items={concepts.map(item => ({
                                    key: item.id,
                                    label: <span id={item.id}>{item.title}</span>,
                                    children: <ConceptBody item={item} />,
                                }))}
                            />
                        ) : (
                            groupByTab(entries.filter(item => item.screen === activeTab)).map(
                                ([tab, items]) => (
                                    <div key={tab} className="mb-4">
                                        <Typography.Text
                                            strong
                                            className="block mb-2 text-textHeadings"
                                        >
                                            {tab}
                                        </Typography.Text>
                                        <Collapse
                                            activeKey={activeKeys}
                                            onChange={onGroupChange(items.map(item => item.id))}
                                            items={items.map(item => ({
                                                key: item.id,
                                                label: <span id={item.id}>{item.label}</span>,
                                                children: <EntryBody item={item} />,
                                            }))}
                                        />
                                    </div>
                                )
                            )
                        )}
                    </div>
                </>
            ) : (
                <Typography.Text className="text-textBody">
                    Nothing matches that search.
                </Typography.Text>
            )}
        </Content>
    );
};

export default AccountingFaq;
