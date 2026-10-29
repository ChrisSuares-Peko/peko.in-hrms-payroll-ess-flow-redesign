import { Flex, Typography } from 'antd';

import { StopPoint } from '../../types/buslist';

const toTitleCase = (str: string) => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

function RadioDot({ checked }: { checked: boolean }) {
    return (
        <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
            border: checked ? 'none' : '2px solid #d9d9d9',
            background: checked ? '#ff4f4f' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {checked && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
        </div>
    );
}

export default function StopItem({ point, selected, onSelect }: { point: StopPoint; selected: boolean; onSelect: () => void }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%', textAlign: 'left',
                padding: '12px 16px', cursor: 'pointer',
                background: selected ? '#fff8f8' : 'white', transition: 'background 0.12s',
                border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#f5f5f5',
            }}
        >
            <RadioDot checked={selected} />
            <Flex vertical gap={2} style={{ flex: 1 }}>
                <Flex justify="space-between" align="center" gap={8}>
                    <Typography.Text style={{ fontWeight: 600, fontSize: 13, color: '#101010', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toTitleCase(point.name)}</Typography.Text>
                    {point.time && (
                        <Typography.Text style={{ fontSize: 12, color: '#595959', fontWeight: 500, flexShrink: 0 }}>{point.time}</Typography.Text>
                    )}
                </Flex>
                {point.landmark && (
                    <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{toTitleCase(point.landmark)}</Typography.Text>
                )}
                {point.address && (
                    <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{toTitleCase(point.address)}</Typography.Text>
                )}
                {point.date && (
                    <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{point.date}</Typography.Text>
                )}
            </Flex>
        </button>
    );
}
