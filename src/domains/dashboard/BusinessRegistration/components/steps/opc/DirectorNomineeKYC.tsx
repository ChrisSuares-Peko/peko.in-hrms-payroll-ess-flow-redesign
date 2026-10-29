import { Typography } from 'antd';

import ImportantRequirements from '../ImportantRequirements';
import RegisteredOfficeSection from '../RegisteredOfficeSection';
import SaveProgressButton from '../SaveProgressButton';
import SaveProgressNote from '../SaveProgressNote';
import StandardPersonFields from '../StandardPersonFields';

const { Title, Paragraph, Text } = Typography;

// Step 2 of the OPC registration form (Figma 1848:28132): the sole director + a
// mandatory nominee. An OPC has a single member, so there are no additional
// shareholders here. RM sidebar comes from the form shell.
const DirectorNomineeKYC = () => (
    <div className="flex flex-col gap-4">
        <div>
            <Title level={3} className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]">
                Director &amp; Nominee KYC
            </Title>
            <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                Identity, PAN and DSC/DIN details
            </Paragraph>
        </div>

        <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-6">
            <SaveProgressNote />

            {/* Director */}
            <div className="flex flex-col gap-3">
                <Text className="!text-[16px] !font-semibold !text-[#1e293b]">Director Details</Text>
                <StandardPersonFields namePrefix="director" indianOnly />
                <div className="flex justify-end">
                    <SaveProgressButton />
                </div>
            </div>

            {/* Nominee */}
            <div className="flex flex-col gap-3">
                <div>
                    <Text className="!block !text-[16px] !font-semibold !text-[#1e293b]">
                        Nominee Details
                    </Text>
                    <Text className="!text-[13px] !text-[#6a7282] !leading-[20px]">
                        Required by law — takes over the company if the sole director is unable to
                        continue.
                    </Text>
                </div>
                <StandardPersonFields namePrefix="nominee" limitAddress indianOnly />
                <div className="flex justify-end">
                    <SaveProgressButton />
                </div>
            </div>

            {/* Registered office — post-payment (moved from Basic Information, 23-07) */}
            <RegisteredOfficeSection />

            <ImportantRequirements />
        </div>
    </div>
);

export default DirectorNomineeKYC;
