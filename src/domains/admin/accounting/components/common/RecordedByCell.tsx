import { Tooltip, Typography } from 'antd';

// Who recorded a hand-made entry; hovering the name shows the address it was recorded from.
const RecordedByCell = ({
    name,
    ipAddress,
}: {
    name: string | null;
    ipAddress?: string | null;
}) => {
    if (!name) return <Typography.Text>—</Typography.Text>;
    return (
        <Tooltip title={ipAddress ? `IP address: ${ipAddress}` : 'IP address not recorded'}>
            <Typography.Text className="cursor-default">{name}</Typography.Text>
        </Tooltip>
    );
};

export default RecordedByCell;
