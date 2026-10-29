import { Col, Flex, Row, Typography } from 'antd';

type Props = {
    from: string;
    to: string;
    count: number;
    isLoading: boolean;
};

export default function RouteSubtitle({ from, to, count, isLoading }: Props) {
    return (
        <Row className="mt-4">
            <Col xs={24}>
                <Flex align="center" gap={8}>
                    <Typography.Text style={{ fontSize: 15, fontWeight: 600, color: '#101010' }}>{from}</Typography.Text>
                    <Typography.Text style={{ fontSize: 15, color: '#8c8c8c' }}>→</Typography.Text>
                    <Typography.Text style={{ fontSize: 15, fontWeight: 600, color: '#101010' }}>{to}</Typography.Text>
                    {!isLoading && (
                        <>
                            <Typography.Text style={{ color: '#ccc', marginInline: 4 }}>·</Typography.Text>
                            <Typography.Text style={{ fontSize: 14, color: '#8c8c8c' }}>
                                {count} buses found
                            </Typography.Text>
                        </>
                    )}
                </Flex>
            </Col>
        </Row>
    );
}
