import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

import ProfitSharingPattern from './ProfitSharingPattern';
import { CONTRIBUTION_UNDERSTANDING_NOTES } from '../../../utils/llp';

const { Title, Paragraph, Text } = Typography;

// Step 3 of the LLP registration form (Figma 1854:39339). RM sidebar from the shell.
const Contribution = () => (
    <div className="flex flex-col gap-4">
        <div>
            <Title level={3} className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]">
                Contribution
            </Title>
            <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                Capital structure and shareholding pattern
            </Paragraph>
        </div>

        <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-6">
            {/* Capital contribution */}
            <div className="flex flex-col gap-3">
                <Text className="!text-[16px] !font-semibold !text-[#1e293b]">Capital Contribution</Text>
                <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-1">
                    <div className="[&_.ant-form-item]:!mb-0">
                        <TextInput
                            label="Total Contribution (min ₹1,000)"
                            name="totalContribution"
                            type="text"
                            placeholder="₹0"
                            allowNumbersOnly
                            size="large"
                        />
                    </div>
                    <Text className="!text-[12px] !text-[#94a3b8]">
                        Enter total to split equally, or set individual contributions below
                    </Text>
                </div>
            </div>

            {/* Profit sharing pattern */}
            <div className="flex flex-col gap-3">
                <Text className="!text-[16px] !font-semibold !text-[#1e293b]">
                    Profit Sharing Pattern
                </Text>
                <ProfitSharingPattern />
            </div>

            {/* Understanding note */}
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[12px] flex gap-2 items-start px-4 py-3">
                <ExclamationCircleOutlined className="text-[#f59e0b] mt-[3px]" style={{ fontSize: 16 }} />
                <div>
                    <Text className="!block !text-[14px] !font-medium !text-[#1e293b] !mb-1">
                        Understanding Capital Structure:
                    </Text>
                    <ul className="list-disc pl-4 flex flex-col gap-1">
                        {CONTRIBUTION_UNDERSTANDING_NOTES.map(note => (
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

export default Contribution;
