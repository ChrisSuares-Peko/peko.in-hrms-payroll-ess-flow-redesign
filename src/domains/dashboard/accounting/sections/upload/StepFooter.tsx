import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

interface StepFooterProps {
    secondaryLabel: string;
    onSecondary: () => void;
    primaryLabel: string;
    onPrimary: () => void;
}

const StepFooter = ({ secondaryLabel, onSecondary, primaryLabel, onPrimary }: StepFooterProps) => (
    <Flex gap={18} className="w-full flex-col sm:flex-row sm:items-center">
        <Button onClick={onSecondary} className="h-12 w-full min-w-0 !text-bodyText sm:flex-1">
            {secondaryLabel}
        </Button>
        <Button type="primary" danger onClick={onPrimary} className="h-12 w-full min-w-0 sm:flex-1">
            {primaryLabel}
            <ArrowRightOutlined className="ml-1" />
        </Button>
    </Flex>
);

export default StepFooter;
