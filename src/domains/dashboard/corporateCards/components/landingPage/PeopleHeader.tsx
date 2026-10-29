import { PlusOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

import { PEOPLE_COPY } from '../../utils/peopleData';

const { Title, Text } = Typography;

interface PeopleHeaderProps {
    onInviteMember: () => void;
}

/** "People" page header: title + subtitle on the left, primary actions on the right. */
const PeopleHeader = ({ onInviteMember }: PeopleHeaderProps) => (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
            <Title level={3} className="!mb-0 !text-textHeadings">
                {PEOPLE_COPY.title}
            </Title>
            <Text className="text-sm text-textBody">{PEOPLE_COPY.subtitle}</Text>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <Button
                type="primary"
                icon={<PlusOutlined />}
                className="font-medium"
                onClick={onInviteMember}
            >
                {PEOPLE_COPY.inviteMember}
            </Button>
        </div>
    </div>
);

export default PeopleHeader;
