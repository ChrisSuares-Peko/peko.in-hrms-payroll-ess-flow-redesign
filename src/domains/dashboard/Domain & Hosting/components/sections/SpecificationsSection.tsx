import { Button, Col, Row, Typography } from 'antd';

const { Text, Title } = Typography;

interface Specs {
    columns: string[];
    rows: Record<string, string[]>[];
}

interface SpecificationsSectionProps {
    osTitle: string;
    hostingSpecs: Specs;
    onViewAllSpecs: () => void;
}

export const SpecificationsSection = ({
    osTitle,
    hostingSpecs,
    onViewAllSpecs,
}: SpecificationsSectionProps) => (
    <div className="mb-4 sm:mb-6 px-4 sm:px-6 pt-0 pb-8 sm:pb-10 max-w-7xl mx-auto">
        <Title
            level={3}
            style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                fontSize: '28px',
                lineHeight: '38px',
                color: '#1E293B',
                marginTop: 0,
                marginBottom: '60px',
            }}
        >
            {osTitle} Technical Specifications
        </Title>
        <div className="mt-10">
            <Row gutter={[24, 40]} align="top">
                {hostingSpecs.columns.map(col => (
                    <Col key={col} xs={24} sm={12} lg={5}>
                        <div
                            className="flex flex-col items-start"
                            style={{ gap: '30px' }}
                        >
                            <Text
                                style={{
                                    fontFamily: 'Roboto, sans-serif',
                                    fontWeight: 600,
                                    fontSize: '22px',
                                    lineHeight: '26px',
                                    color: '#1E293B',
                                    display: 'block',
                                }}
                            >
                                {col}
                            </Text>
                            <div className="flex flex-col gap-6 w-full">
                                {hostingSpecs.rows[0][col as keyof typeof hostingSpecs.rows[0]]?.map(
                                    (item: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex flex-row items-center gap-2"
                                        >
                                            <div className="bg-lightRed rounded-full flex-shrink-0 w-1.5 h-1.5" />
                                            <Text
                                                style={{
                                                    fontFamily: 'Roboto, sans-serif',
                                                    fontWeight: 400,
                                                    fontSize: '12px',
                                                    lineHeight: '22px',
                                                    color: '#6F6C8F',
                                                }}
                                            >
                                                {item}
                                            </Text>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </Col>
                ))}
                <Col xs={24} lg={4} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                    <Button
                        className="bg-lightRed border-lightRed text-white"
                        onClick={onViewAllSpecs}
                        style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 600,
                            fontSize: '16px',
                            height: '45px',
                            borderRadius: '10px',
                            padding: '0 24px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        View all tech specs
                    </Button>
                </Col>
            </Row>
        </div>
    </div>
);
