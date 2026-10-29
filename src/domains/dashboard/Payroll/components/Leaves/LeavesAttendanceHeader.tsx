import { Button, Flex, Typography } from 'antd';

interface HeaderProps {
    activeTab: string;
    onAddLeave: () => void;
}

const LeavesAttendanceHeader = ({ activeTab, onAddLeave }: HeaderProps) => {
    const isLeaveTab = activeTab === '1';

    return (
        <Flex className="justify-between md:flex-row" align="center">
            <Typography.Paragraph className="text-neutral-700 text-xl font-medium">
                {isLeaveTab ? 'Leaves' : 'Leave Requests'}
            </Typography.Paragraph>

            <Flex gap={10} className="justify-end">
                {isLeaveTab && (
                    <Button danger type="primary" onClick={onAddLeave}>
                        Add Leave
                    </Button>
                )}
            </Flex>
        </Flex>
    );
};

export default LeavesAttendanceHeader;
