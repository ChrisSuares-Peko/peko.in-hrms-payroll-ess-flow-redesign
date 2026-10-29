import { Typography } from 'antd';

import DirectorCard from './DirectorCard';
import { KYC_SUBTITLE, KYC_TITLE } from '../../../utils/proprietorKyc';
import ImportantRequirements from '../ImportantRequirements';
import RegisteredOfficeSection from '../RegisteredOfficeSection';
import SaveProgressButton from '../SaveProgressButton';
import SaveProgressNote from '../SaveProgressNote';

const { Title, Paragraph, Text } = Typography;

// Step 2 of the Proprietorship registration form (Figma 1808:21171). Mirrors the
// company KYC steps (OPC / Private Limited): person KYC, then the registered
// office, then the requirements note. A proprietorship has exactly one owner, so
// there is no person count to pick. RM sidebar comes from the form shell.
const ProprietorKYC = () => (
    <div className="flex flex-col gap-4">
        <div>
            <Title
                level={3}
                className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]"
            >
                {KYC_TITLE}
            </Title>
            <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                {KYC_SUBTITLE}
            </Paragraph>
        </div>

        <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-6">
            <SaveProgressNote />

            <div className="flex flex-col gap-3">
                <Text className="!text-[16px] !font-semibold !text-[#1e293b]">
                    Proprietor Details
                </Text>
                <DirectorCard index={1} label="Proprietor" indianOnly />
                <div className="flex justify-end">
                    <SaveProgressButton />
                </div>
            </div>

            {/* Registered office — post-payment, same as the company entities. */}
            <RegisteredOfficeSection />

            <ImportantRequirements />
        </div>
    </div>
);

export default ProprietorKYC;
