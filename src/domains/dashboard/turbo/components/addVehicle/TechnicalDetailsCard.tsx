import { Col, Flex, Row, Typography } from 'antd';

import { isLongToken } from '../../utils/layout';

const UNITS: Record<string, string> = {
    Wheelbase: 'MM',
    'Unladen / Gross Weight': 'KG',
};

// The RC vendor returns "0" or "" when a figure is not on record — show N/A rather than "0 MM".
// A value that already carries text (e.g. "2450 MM") is shown as-is.
export const formatTechnicalValue = (label: string, value: unknown): string => {
    const text = value === null || value === undefined ? '' : String(value).trim();
    if (!text) return 'N/A';
    const unit = UNITS[label];
    if (!unit || /[a-z]/i.test(text)) return text;
    const numeric = Number(text);
    return Number.isFinite(numeric) && numeric > 0 ? `${text} ${unit}` : 'N/A';
};

const TechnicalDetailsCard = ({ technicalDetails }: any) => (
    <Col xs={24} md={12}>
        <div className="h-full p-6 border rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
            <Typography.Text className="text-sm font-semibold">
                Technical Details
            </Typography.Text>
            <Row gutter={[20, 20]} className="mt-4">
                {technicalDetails.map((item: any, index: number) => {
                    // Identifiers like a 17-char chassis number don't fit a quarter-width column even on
                    // desktop, so long single tokens take two slots (full row on phones).
                    const wide = isLongToken(item.value);
                    return (
                        <Col xs={wide ? 24 : 12} sm={12} xl={wide ? 12 : 6} key={index}>
                            <Flex vertical gap={5} className="justify-between h-full">
                                <Typography.Text type="secondary" className="text-xs">
                                    {item.label}
                                </Typography.Text>
                                <Typography.Text className="text-base font-medium break-normal">
                                    {formatTechnicalValue(item.label, item.value)}
                                </Typography.Text>
                            </Flex>
                        </Col>
                    );
                })}
            </Row>
        </div>
    </Col>
);

export default TechnicalDetailsCard;
