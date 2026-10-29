import { ClockCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Title, Text } = Typography;

/** Placeholder shown for tabs that are not designed/built yet. */
const ComingSoon = ({ title }: { title: string }) => (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-borderCard bg-white px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-bgLightPink text-2xl text-textLightRed">
            <ClockCircleOutlined />
        </span>
        <Title level={4} className="!mb-0 !text-textHeadings">
            {title}
        </Title>
        <Text className="max-w-md text-sm text-textBody">
            This section is coming soon. We&apos;re putting the finishing touches on {title} - check
            back shortly.
        </Text>
    </div>
);

export default ComingSoon;
