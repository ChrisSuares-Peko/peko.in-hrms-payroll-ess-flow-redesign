import { Avatar, Button, Drawer, Flex, List, Row, Typography } from 'antd';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';

interface SubscriptionEmployeesListModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
}

function getInitials(name: string): string {
    const nameBeforeHyphen = name.split('-')[0].trim();

    const words = nameBeforeHyphen.split(' ');

    const initials = words
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return initials;
}

const SubscriptionEmployeesListModal = ({
    open,
    handleCancel,
    selectedRecordData,
}: SubscriptionEmployeesListModalProps) => {
    useHideWidgetOnDrawer(true);
    return (
        <Drawer
            title="Assigned Employees"
            open={open}
            onClose={() => {
                handleCancel();
            }}
            closeIcon={null}
            // destroyOnClose
            width={350}
            styles={{
                body: { paddingInline: 0, paddingBlock: 0 },
                header: { paddingInline: 20 },
            }}
            zIndex={20}
            footer={[
                <Flex className="w-full " justify="flex-end" gap={10} key="">
                    <Button
                        key="back"
                        onClick={() => {
                            handleCancel();
                        }}
                        className="px-5"
                    >
                        Cancel
                    </Button>
                </Flex>,
            ]}
        >
            <List
                dataSource={selectedRecordData?.assignTo || []}
                bordered={false}
                renderItem={(item: any, i) => (
                    <List.Item key={i} className="min-w-full">
                        <Flex vertical className="min-w-full px-5">
                            <Flex gap="small" align="center">
                                <Flex align="center">
                                    <Avatar style={{ backgroundColor: '#fde3cf', color: 'red' }}>
                                        {getInitials(item.employeeName)}
                                    </Avatar>
                                </Flex>
                                <Row className="">
                                    <Typography.Text className="w-full ">
                                        {item.employeeName ?? ''}
                                    </Typography.Text>
                                </Row>
                            </Flex>
                        </Flex>
                    </List.Item>
                )}
            />
        </Drawer>
    );
};

export default SubscriptionEmployeesListModal;
