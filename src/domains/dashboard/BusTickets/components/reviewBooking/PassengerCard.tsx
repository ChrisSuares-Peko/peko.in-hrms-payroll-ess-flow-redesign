import { Flex, Typography } from 'antd';

import { PassengerInfo } from '../../types/buslist';

export type { PassengerInfo };

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <Flex vertical gap={4}>
            <Typography.Text style={{ color: '#86898B', fontSize: 14 }}>{label}</Typography.Text>
            <Typography.Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>{value}</Typography.Text>
        </Flex>
    );
}

export default function PassengerCard({ passenger }: { passenger: PassengerInfo }) {
    return (
        <Flex
            vertical
            gap={15}
            style={{
                background: 'white',
                border: '1px solid #EAEAEA',
                borderRadius: 10,
                padding: 24,
                flex: 1,
                minWidth: 0,
            }}
        >
            <Typography.Text style={{ fontSize: 18, fontWeight: 600, color: '#000' }}>
                Passenger {passenger.id}
            </Typography.Text>

            <Flex gap={40}>
                <Flex vertical gap={16}>
                    <InfoItem label="Name" value={passenger.name} />
                    <InfoItem label="ID Number" value={passenger.idNumber} />
                    <InfoItem label="Seat" value={passenger.seat} />
                </Flex>
                <Flex vertical gap={16}>
                    <InfoItem label="Ticket Number" value={passenger.ticketNumber} />
                    <InfoItem label="Email" value={passenger.email} />
                </Flex>
            </Flex>
        </Flex>
    );
}
