import { ReactNode } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';

import { cn } from '../../utils/cn';
import { TabItem } from '../../utils/types';

interface PageTabsProps {
    tabs: TabItem[];
    activeKey: string;
    /** Receives the clicked tab key, or the selected child key for dropdown tabs. */
    onChange: (key: string) => void;
    /** Optional content pinned to the right of the tab bar (e.g. a brand logo). */
    rightSlot?: ReactNode;
}

/**
 * In-page feature tab bar (distinct from the global navbar). Renders simple tabs
 * and dropdown tabs; the active tab gets a brand-red label and underline.
 * Horizontally scrollable on small screens so it never overflows the page.
 */
const PageTabs = ({ tabs, activeKey, onChange, rightSlot }: PageTabsProps) => (
    <nav className="hide-scrollbar -mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max flex-1 items-end gap-4 border-b border-borderDivider sm:gap-6 lg:gap-8">
            {tabs.map(tab => {
                const isActive =
                    tab.key === activeKey || !!tab.children?.some(child => child.key === activeKey);
                const baseLabel = cn(
                    'flex items-center gap-1 whitespace-nowrap border-b-2 pb-0.5 pt-1 text-sm transition-colors',
                    isActive
                        ? 'border-textLightRed font-medium text-textLightRed'
                        : 'border-transparent text-textBody hover:text-textHeadings'
                );

                if (tab.children?.length) {
                    const activeChild = tab.children.find(child => child.key === activeKey);
                    return (
                        <li key={tab.key}>
                            <Dropdown
                                menu={{
                                    items: tab.children.map(child => ({
                                        key: child.key,
                                        label: child.label,
                                    })),
                                    onClick: info => onChange(info.key),
                                }}
                                trigger={['click']}
                            >
                                <button type="button" className={baseLabel}>
                                    {activeChild
                                        ? `${tab.label} · ${activeChild.label}`
                                        : tab.label}
                                    <DownOutlined className="text-xs" />
                                </button>
                            </Dropdown>
                        </li>
                    );
                }

                return (
                    <li key={tab.key}>
                        <button
                            type="button"
                            className={baseLabel}
                            onClick={() => onChange(tab.key)}
                        >
                            <span className="leading-5">{tab.label}</span>
                            {!!tab.badge && (
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-bgLightPink px-1.5 text-xs font-medium leading-none text-textLightRed">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    </li>
                );
            })}
        </ul>
        {rightSlot && <div className="ml-24 flex shrink-0 items-center">{rightSlot}</div>}
    </nav>
);

export default PageTabs;
