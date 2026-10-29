import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export const stripEmoji = (val: string) => val.replace(/\p{Extended_Pictographic}/gu, '');

export const moreColumn = (expandedKeys: string[], onToggle: (key: string) => void) => ({
    title: '',
    key: 'more',
    width: '10%',
    render: (_: any, record: { key: string }) => (
        <Button
            type="text"
            size="small"
            icon={expandedKeys.includes(record.key) ? <UpOutlined /> : <DownOutlined />}
            onClick={() => onToggle(record.key)}
        />
    ),
});
