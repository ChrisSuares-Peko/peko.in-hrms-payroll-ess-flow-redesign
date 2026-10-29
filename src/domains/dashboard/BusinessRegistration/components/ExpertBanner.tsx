import { useState } from 'react';

import { Button, Typography } from 'antd';

import RequestCallbackModal from './RequestCallbackModal';
import customerSupportIcon from '../assets/customerSupport.svg';
import { EXPERT_CTA, EXPERT_SUBTITLE, EXPERT_TITLE } from '../utils/data';

const { Text } = Typography;

// "Not sure which structure to choose?" expert-consult banner (Figma 1760:21960).
// The CTA opens the Request-a-callback modal (creates an IndiaFilings CRM lead).
const ExpertBanner = () => {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-bgLightRose border border-borderLightRose rounded-[16px] px-4 sm:px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0 bg-[#fff2f2] rounded-full w-[44px] h-[44px] flex items-center justify-center">
                    <img src={customerSupportIcon} alt="" aria-hidden className="w-[24px] h-[24px]" />
                </div>
                <div>
                    <Text className="!block !text-[15px] !font-semibold !text-[#383838] !leading-[22px]">
                        {EXPERT_TITLE}
                    </Text>
                    <Text className="!text-[13px] !text-[#64748b] !font-normal !leading-[20px]">
                        {EXPERT_SUBTITLE}
                    </Text>
                </div>
            </div>
            <Button
                onClick={() => setOpen(true)}
                className="!h-[40px] !px-4 !text-[14px] !font-medium !rounded-[8px] !border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5] transition-colors flex-shrink-0 w-full sm:w-auto"
            >
                {EXPERT_CTA}
            </Button>
            <RequestCallbackModal open={open} onClose={() => setOpen(false)} />
        </div>
    );
};

export default ExpertBanner;
