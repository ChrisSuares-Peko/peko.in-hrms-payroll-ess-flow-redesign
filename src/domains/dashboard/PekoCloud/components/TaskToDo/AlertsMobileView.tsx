import { Card, Col, Flex, Row, Typography, Empty, Skeleton } from 'antd';

import AlertsMobileCard from './AlertsMobileCard';

interface AlertsMobileProps {
    tableDatas: any;
    isLoading: any;
}

const AlertsMobileView = ({ tableDatas, isLoading }: AlertsMobileProps) => {
    const renderSkeleton = () => <Skeleton active paragraph={{ rows: 3 }} />;

    let tableContent;
    if (isLoading) {
        tableContent = Array.from({ length: 10 }).map((_, index) => (
            <Card size="small" className="mt-4 h-40 bg-slate-50 border-none p-2" key={index}>
                <Flex className="w-full" gap={5} vertical>
                    {renderSkeleton()}
                </Flex>
            </Card>
        ));
    } else if (tableDatas.length === 0) {
        tableContent = <Empty description="No data available" />;
    } else {
        tableContent = tableDatas.map((item: any, index: number) => (
            <AlertsMobileCard key={index} item={item} />
        ));
    }
    return (
        <Flex vertical gap={20} className="">
            <Row align="middle" className="p-5 rounded-md bg-bgLightGray">
                <Col xs={12}>
                    {' '}
                    <Flex justify="start">
                        <Typography.Text className="text-[#475467] font-medium">
                            Alerts
                        </Typography.Text>
                    </Flex>
                </Col>

                <Col xs={12}>
                    {' '}
                    <Flex justify="center">
                        {' '}
                        <Typography.Text className="text-[#475467] font-medium">
                            Date
                        </Typography.Text>
                    </Flex>
                </Col>
            </Row>
            {tableContent}
        </Flex>
    );
};

export default AlertsMobileView;
