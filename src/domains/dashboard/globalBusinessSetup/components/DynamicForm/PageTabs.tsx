import { Tabs } from 'antd';

import { IPage } from '../../types/forms';

type PageTabsProps = {
    pages: IPage[];
    currentPage: string;
    onChange: (pageId: string) => void;
    maxVisitedIndex?: number;
};

export default function PageTabs({ pages, currentPage, onChange, maxVisitedIndex }: PageTabsProps) {
    const currentIndex = pages.findIndex(p => p._id === currentPage);
    const effectiveMaxVisitedIndex =
        typeof maxVisitedIndex === 'number' ? maxVisitedIndex : currentIndex;
    const items = pages.map((page, index) => ({
        key: page._id,
        label: page.title,
        disabled: index > effectiveMaxVisitedIndex,
    }));

    const handleChange = (pageId: string) => {
        const container = document.getElementById('myContainer');
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        onChange(pageId);
    };

    return <Tabs activeKey={currentPage} onChange={handleChange} items={items} type="line" />;
}
