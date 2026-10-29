import { ArrowRightOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

import { REQUIRED_INFO, REQUIRED_INFO_TITLE } from '../utils/data';

const { Text } = Typography;

// "What you will need" — requirements laid out in a 3-column grid (Figma 1760:21960).
const Requirements = () => (
    <section className="flex flex-col gap-5">
        <Text className="!text-[16px] !font-semibold !text-[#475569] uppercase !leading-[28px]">
            {REQUIRED_INFO_TITLE}
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {REQUIRED_INFO.map((info, idx) => (
                <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-white border border-borderLightRose rounded-[9px] w-[28px] h-[28px] flex items-center justify-center">
                        <ArrowRightOutlined className="text-[#ff4f4f]" style={{ fontSize: 11 }} />
                    </div>
                    <Text className="!text-[13px] !text-black !font-normal !leading-[20px] pt-[3px]">
                        {info}
                    </Text>
                </div>
            ))}
        </div>
    </section>
);

export default Requirements;
