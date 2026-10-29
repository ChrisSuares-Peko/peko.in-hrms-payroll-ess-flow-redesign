import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Col, Row, Typography } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';

import { numberRangeOptions } from '../../utils/proprietorKyc';

const { Text } = Typography;

const NUMBER_OPTIONS = numberRangeOptions(1, 10);

const DSC_NOTES = [
    'A Digital Signature Certificate (DSC) is required for all Directors and Shareholders (and the Nominee in an OPC).',
    'Payment workflow — Digital Signature: As per current Indian regulations, the person completing KYC must pay for their own DSC. Intermediaries are not permitted to purchase or issue DSCs on their behalf.',
];

// "Structure" (Figma 1844:25098) — Partnership/LLP only. OPC is fixed (director +
// nominee) and Private Limited manages its director count on the KYC step.
const Structure = () => (
    <div className="flex flex-col gap-3">
            <Text className="!text-[18px] !font-semibold !text-[#1e293b] !leading-[26px]">Structure</Text>
            <div className="border border-[#e4e4e7] rounded-[24px] p-6 flex flex-col gap-6">
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <SelectInput
                            label="Number of Directors"
                            name="numberOfDirectors"
                            options={NUMBER_OPTIONS}
                            placeholder="Select"
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <SelectInput
                            label="Number of Shareholders"
                            name="numberOfShareholders"
                            options={NUMBER_OPTIONS}
                            placeholder="Select"
                            size="large"
                        />
                    </Col>
                </Row>
                <div className="flex flex-col gap-3">
                    {DSC_NOTES.map(note => (
                        <div
                            key={note}
                            className="bg-[#fffcec] flex gap-2 items-start px-3 py-[10px] rounded-[8px]"
                        >
                            <ExclamationCircleOutlined className="text-[#ffa940] mt-[2px]" style={{ fontSize: 16 }} />
                            <Text className="!text-[13px] !text-[rgba(0,0,0,0.85)] !leading-[20px]">
                                {note}
                            </Text>
                        </div>
                ))}
            </div>
        </div>
    </div>
);

export default Structure;
