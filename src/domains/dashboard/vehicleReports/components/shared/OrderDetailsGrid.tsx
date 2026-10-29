import { ReactNode } from 'react';

import { Col, Row } from 'antd';

import LabelValue from '../../../turbo/components/addVehicle/LabelValue';

export interface DetailItem {
    label: string;
    value: ReactNode;
}

interface Props {
    items: DetailItem[];
    // 4 per row on the order-details and history-result cards; 2 for the
    // inspection booking card, whose values are long.
    columns?: 2 | 3 | 4;
}

const spanFor = (columns: 2 | 3 | 4) => {
    if (columns === 2) return { lg: 12, xl: 12 };
    if (columns === 3) return { lg: 8, xl: 8 };
    return { lg: 6, xl: 6 };
};

// Responsive label/value grid used by all three order-detail variants.
const OrderDetailsGrid = ({ items, columns = 4 }: Props) => {
    const span = spanFor(columns);
    return (
        <Row gutter={[24, 24]}>
            {items.map(item => (
                <Col key={item.label} xs={12} sm={12} md={8} lg={span.lg} xl={span.xl}>
                    <LabelValue
                        label={item.label}
                        value={item.value}
                        labelClassName="text-xs text-[#98A2B3]"
                        valueClassName="mt-1 font-medium text-[#0A0A0A]"
                    />
                </Col>
            ))}
        </Row>
    );
};

export default OrderDetailsGrid;
