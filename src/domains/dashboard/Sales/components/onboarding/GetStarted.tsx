import { Button, Flex } from 'antd';

import CenteredHeader from '../shared/CenteredHeader';

type Props = {
    onNext: () => void;
};

const GetStarted = ({ onNext }: Props) => (
    <Flex vertical gap={20} align="center">
        <CenteredHeader
            title="Get Started with Payment Collections"
            description="Activate your payment collections service to start accepting payments from customers"
        />
        <Button type="primary" danger block className="h-10" onClick={onNext}>
            Activate Payment Collections
        </Button>
    </Flex>
);

export default GetStarted;
