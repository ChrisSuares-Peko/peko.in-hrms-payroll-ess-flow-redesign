import type { FC, ReactNode } from 'react';

import { Card, Tag, Typography } from 'antd';

const { Text } = Typography;

/** Rounded status/label pill — shared by the order- and issue-detail pages. */
export const Pill: FC<{ bg: string; color: string; children: ReactNode }> = ({ bg, color, children }) => (
    <Tag style={{ background: bg, color, border: 'none', borderRadius: 999, padding: '2px 12px', fontWeight: 500 }}>
        {children}
    </Tag>
);

/** Titled sidebar card — shared by the order- and issue-detail pages. */
export const SidebarCard: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
    <Card size="small" className="!rounded-xl" styles={{ body: { padding: 16 } }}>
        <Text className="text-[13px] font-semibold text-[#101828]">{title}</Text>
        <div className="mt-3">{children}</div>
    </Card>
);
