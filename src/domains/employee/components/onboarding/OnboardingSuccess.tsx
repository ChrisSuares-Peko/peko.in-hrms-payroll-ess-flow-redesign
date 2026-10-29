import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

interface OnboardingSuccessProps {
    firstName: string;
    onGoToDashboard: () => void;
}

const OnboardingSuccess = ({ firstName, onGoToDashboard }: OnboardingSuccessProps) => (
    <Flex vertical align="center" justify="center" gap={12} className="w-full py-24">
        <CheckCircleFilled className="text-[#12B76A] text-[56px]" />
        <Typography.Title level={3} className="!mb-0">
            You&apos;re all set, {firstName}!
        </Typography.Title>
        <Typography.Text className="text-gray-500">
            Your profile, documents, and bank details have been submitted.
        </Typography.Text>
        <Button
            onClick={onGoToDashboard}
            className="mt-2 text-brandColor border-brandColor rounded-lg"
        >
            Go to Dashboard
        </Button>
    </Flex>
);

export default OnboardingSuccess;
