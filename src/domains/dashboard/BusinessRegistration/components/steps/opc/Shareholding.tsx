import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Col, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import RepresentedCompanies from './RepresentedCompanies';
import ShareholdingPattern from './ShareholdingPattern';
import {
    capitalUnderstandingNotes,
    FACE_VALUE_OPTIONS,
    PAID_UP_COMPLIANCE_NOTE,
    formatINR,
} from '../../../utils/opc';
import { shareholdingTotal } from '../../../utils/person';

const { Title, Paragraph, Text } = Typography;

const Calc = ({ label, value }: { label: string; value: string }) => (
    <div className="flex-1 p-4">
        <Text className="!block !text-[13px] !text-[#6a7282]">{label}</Text>
        <Text className="!text-[18px] !font-semibold !text-[#1e293b]">{value}</Text>
    </div>
);

// Step 3 of the OPC registration form (Figma 1848:29302). RM sidebar from the shell.
const Shareholding = () => {
    const { values } = useFormikContext<Record<string, unknown>>();
    const totalShares = shareholdingTotal(values);
    const faceValue = Number(values.faceValuePerShare) || 0;
    const authorizedCapital = Number(values.authorizedCapital) || 0;
    const paidUpCapital = Number(values.paidUpCapital) || 0;
    // Authorized capital is only the ceiling; the PAID-UP capital is what's issued
    // now and must be fully allotted. Every paid-up share must be allotted, and the
    // total can never exceed the authorized shares. Enforced by the step schema.
    const authorizedShares = faceValue ? Math.floor(authorizedCapital / faceValue) : 0;
    const paidUpShares = faceValue ? Math.floor(paidUpCapital / faceValue) : 0;
    const misallotted = paidUpShares > 0 && totalShares > 0 && totalShares !== paidUpShares;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Title level={3} className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]">
                    Shareholding
                </Title>
                <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                    Capital structure and shareholding pattern
                </Paragraph>
            </div>

            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-6">
                {/* Capital Structure */}
                <div className="flex flex-col gap-3">
                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">Capital Structure</Text>
                    <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-4">
                        {/* bottom-aligned: the Authorized Capital label wraps to two
                            lines, so the selects would otherwise sit at different heights.
                            Vertical gutter matters once they stack — at 0 the three fields
                            ran together as one block on every phone. */}
                        <Row gutter={[16, 16]} align="bottom">
                            <Col xs={24} sm={12} md={8}>
                                <TextInput label="Authorized Capital (min ₹1,00,000)" name="authorizedCapital" type="text" placeholder="e.g. 100000" allowNumbersOnly size="large" />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <TextInput label="Paid-up Capital (≤ Authorized)" name="paidUpCapital" type="text" placeholder="e.g. 100000" allowNumbersOnly size="large" />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <SelectInput label="Face Value per Share (Typically ₹10)" name="faceValuePerShare" options={FACE_VALUE_OPTIONS} placeholder="Select" size="large" />
                            </Col>
                        </Row>
                        <div className="bg-[#fffbeb] flex gap-2 items-start px-3 py-[10px] rounded-[8px]">
                            <ExclamationCircleOutlined className="text-[#f59e0b] mt-[2px]" style={{ fontSize: 16 }} />
                            <div>
                                <Text className="!block !text-[14px] !font-medium !text-[#1e293b]">
                                    Paid-up capital compliance
                                </Text>
                                <Text className="!text-[13px] !text-[#475569] !leading-[20px]">
                                    {PAID_UP_COMPLIANCE_NOTE}
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shareholding Pattern */}
                <div className="flex flex-col gap-3">
                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">
                        Shareholding Pattern
                    </Text>
                    {paidUpShares > 0 && (
                        <Text className="!text-[13px] !text-[#6a7282]">
                            All {paidUpShares.toLocaleString('en-IN')} paid-up shares must be allotted
                            in total ({formatINR(paidUpCapital)} paid-up ÷ {formatINR(faceValue)} face
                            value). Up to {authorizedShares.toLocaleString('en-IN')} authorized shares
                            are available.
                        </Text>
                    )}
                    <ShareholdingPattern />
                    {misallotted && (
                        <Text className="!text-[13px] !text-[#ff4f4f]">
                            {totalShares.toLocaleString('en-IN')} of{' '}
                            {paidUpShares.toLocaleString('en-IN')} shares allotted — the total must
                            equal exactly {paidUpShares.toLocaleString('en-IN')} (all paid-up shares).
                        </Text>
                    )}
                </div>

                {/* Director and Representative body-corporate details (only shown
                    when at least one director carries the representative role). */}
                <RepresentedCompanies />

                {/* Calculated Values */}
                <div className="flex flex-col gap-2">
                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">Calculated Values</Text>
                    <Text className="!text-[13px] !text-[#6a7282]">
                        Auto-computed from face value and the shares allotted below.
                    </Text>
                    <div className="border border-[#e4e4e7] rounded-[16px] flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-[#ebebeb]">
                        <Calc label="Authorized Shares" value={authorizedShares.toLocaleString('en-IN')} />
                        <Calc label="Paid-up Shares" value={paidUpShares.toLocaleString('en-IN')} />
                        <Calc label="Shares Allotted" value={totalShares.toLocaleString('en-IN')} />
                    </div>
                </div>

                {/* Understanding note */}
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[12px] flex gap-2 items-start px-4 py-3">
                    <ExclamationCircleOutlined className="text-[#f59e0b] mt-[3px]" style={{ fontSize: 16 }} />
                    <div>
                        <Text className="!block !text-[14px] !font-medium !text-[#1e293b] !mb-1">
                            Understanding Capital Structure:
                        </Text>
                        <ul className="list-disc pl-4 flex flex-col gap-1">
                            {capitalUnderstandingNotes(values.entityType as string).map(note => (
                                <li key={note} className="text-[13px] text-[#475569] leading-[20px]">
                                    {note}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Shareholding;
