import { Col, Row } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

import ReportSectionCard from '../shared/ReportSectionCard';

// Odometer reading and city — the two free-text inputs on the valuation form, and
// between them the biggest levers on the valuation Droom computes. Both are required
// by the OBV endpoint (DROOM_MYBIZ_API_REFERENCE.md §3).
const UsageSection = () => (
    <ReportSectionCard title="Usage">
        <Row gutter={[24, 20]}>
            <Col xs={24} md={12}>
                <TextInput
                    name="kilometresDriven"
                    label="Kilometres driven"
                    placeholder="e.g. 45000"
                    type="text"
                    size="large"
                    inputMode="numeric"
                    allowNumbersOnly
                    maxLength={7}
                />
            </Col>
            <Col xs={24} md={12}>
                {/* Free text rather than a select: Droom prices against its own city
                    list, which it exposes no lookup for. The backend lowercases this
                    to match the casing the vendor's own sample uses. */}
                <TextInput
                    name="city"
                    label="City"
                    placeholder="e.g. Jaipur"
                    type="text"
                    size="large"
                    allowAlphabetsAndSpaceOnly
                    maxLength={50}
                />
            </Col>
        </Row>
    </ReportSectionCard>
);

export default UsageSection;
