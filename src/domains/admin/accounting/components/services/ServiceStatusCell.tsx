import { Flex, Typography } from 'antd';

import { AccountingService } from '../../types/services';
import { serviceConfigurationStatus } from '../../utils/commission';
import StatusPill from '../common/StatusPill';

const ServiceStatusCell = ({ service }: { service: AccountingService }) => {
    const { label, tone, notes } = serviceConfigurationStatus(service);
    return (
        <Flex vertical gap={4} align="start">
            <StatusPill label={label} tone={tone} />
            {notes.map(note => (
                <Typography.Text key={note} className="text-xs text-muted">
                    {note}
                </Typography.Text>
            ))}
        </Flex>
    );
};

export default ServiceStatusCell;
