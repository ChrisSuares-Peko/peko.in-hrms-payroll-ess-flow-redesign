import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { ApplicationListItem } from '../../apis';
import { setSelectedApplication, setSelectedService } from '../../slices';
import { Service } from '../../types';

const { Text } = Typography;

const TRACK_STATUSES = ['SUBMITTED', 'IN_REVIEW', 'REUPLOAD', 'REJECTED', 'ACTION_REQUIRED', 'APPROVED', 'COMPLETED'];

interface ServiceCardProps {
    service: Service;
    application?: ApplicationListItem;
}

const ServiceCard = ({ service, application }: ServiceCardProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const hasActiveApplication = application && TRACK_STATUSES.includes(application.status);

    const handleTrack = () => {
        dispatch(setSelectedApplication(application!));
        navigate(`${paths.dashboard.governmentServices}/${paths.governmentServices.application}/${application!.id}`);
    };

    return (
        <Flex
            vertical
            gap={12}
            className="rounded-lg p-4 h-full"
            style={{ border: '1px solid #F0F0F0', backgroundColor: '#FFFFFF' }}
        >
            <Flex vertical gap={4}>
                <Text strong className="text-sm">
                    {service.name}
                </Text>
                <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                    {service.description}
                </Text>
            </Flex>

            {hasActiveApplication ? (
                <Button
                    block
                    style={{ color: '#FF3A3A', borderColor: '#FF3A3A', marginTop: 'auto' }}
                    onClick={handleTrack}
                >
                    Track Application
                </Button>
            ) : (
                <Button
                    block
                    style={{ color: '#FF3A3A', borderColor: '#FF3A3A', marginTop: 'auto' }}
                    onClick={() => {
                        dispatch(setSelectedService(service));
                        navigate(`${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${service.id}`);
                    }}
                >
                    Apply Now
                </Button>
            )}
        </Flex>
    );
};

export default ServiceCard;
