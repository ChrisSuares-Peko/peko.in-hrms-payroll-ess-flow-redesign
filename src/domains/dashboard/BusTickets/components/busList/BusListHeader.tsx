import { Flex, Typography } from 'antd';

export type SortKey = 'departure' | 'duration' | 'arrival' | 'price';
export type SortDir = 'asc' | 'desc' | null;

interface Props {
    activeSort: SortKey | null;
    sortDir: SortDir;
    onSortToggle: (key: SortKey) => void;
}

const COLUMNS: { key: SortKey; label: string }[] = [
    { key: 'departure', label: 'Departure' },
    { key: 'duration',  label: 'Duration'  },
    { key: 'arrival',   label: 'Arrival'   },
    { key: 'price',     label: 'Price'     },
];

export default function BusListHeader({ activeSort, sortDir, onSortToggle }: Props) {
    return (
        <div className="hidden md:block">
            <Flex
                align="center"
                justify="space-between"
                style={{ background: '#F4F6FA', border: '1px solid #e2e2e2', borderRadius: 4, padding: '8px 20px' }}
            >
                {COLUMNS.map(({ key, label }) => {
                    const isActive = activeSort === key;
                    let arrow = ' ↕';
                    if (isActive && sortDir === 'asc') arrow = ' ↑';
                    else if (isActive && sortDir === 'desc') arrow = ' ↓';
                    return (
                        <Typography.Text
                            key={key}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSortToggle(key)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSortToggle(key); }}
                            style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#ff4f4f' : '#8c8c8c', cursor: 'pointer', userSelect: 'none' }}
                        >
                            {label}{arrow}
                        </Typography.Text>
                    );
                })}
            </Flex>
        </div>
    );
}
