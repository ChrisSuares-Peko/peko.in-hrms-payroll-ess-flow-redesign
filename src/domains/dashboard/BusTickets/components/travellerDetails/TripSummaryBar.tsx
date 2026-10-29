import { Flex, Typography } from 'antd';

type Props = {
    from: string;
    to: string;
    date: string;
    departTime: string;
    arrivalTime: string;
    operator: string;
    busType: string;
};

export default function TripSummaryBar({ from, to, date, departTime, arrivalTime, operator, busType }: Props) {
    return (
        <Flex
            justify="space-between"
            align="center"
            style={{
                border: '1px solid #CBD5E1',
                borderRadius: 18,
                padding: '20px 24px',
                background: 'white',
            }}
        >
            <Flex vertical gap={6}>
                <Typography.Text style={{ fontSize: 17, fontWeight: 500, color: '#000' }}>
                    {from} → {to}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)' }}>
                    {date} · {departTime} – {arrivalTime}
                </Typography.Text>
            </Flex>
            <Flex vertical gap={6} align="flex-end">
                <Typography.Text style={{ fontSize: 17, fontWeight: 500, color: '#000' }}>
                    {operator}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)' }}>
                    {busType}
                </Typography.Text>
            </Flex>
        </Flex>
    );
}
