import { Typography } from 'antd';

import lampChargeIcon from '../../assets/lamp-charge.svg';
import { VIDEO_KYC_NOTE } from '../../utils/proprietorKyc';

const { Text } = Typography;

// Shared "Video KYC required" note shown on each person card. The lamp icon sits
// in a solid #6F3ED8 badge (white glyph) rather than aligned inline with the text.
const VideoKycNote = () => (
    <div className="bg-[#f6f3ff] border border-[#ede9fe] rounded-[8px] flex gap-2.5 items-center px-3 py-[10px]">
        <div className="flex-shrink-0 bg-[#6F3ED8] rounded-full w-[28px] h-[28px] flex items-center justify-center">
            <img src={lampChargeIcon} alt="" aria-hidden className="w-4 h-4" />
        </div>
        <Text className="!text-[13px] !text-[#475569] !leading-[20px]">
            <span className="font-semibold text-[#1e293b]">Video KYC required.</span> {VIDEO_KYC_NOTE}
        </Text>
    </div>
);

export default VideoKycNote;
