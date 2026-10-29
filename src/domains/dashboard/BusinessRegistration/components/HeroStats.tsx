import { Flex, Typography } from 'antd';

import { STATS } from '../utils/data';

const { Text } = Typography;

// The three intro stat cards (time / steps / digital). Shared hero element so the
// landing and any later confirmation views render the same band.
const HeroStats = () => (
    <div className="flex gap-3 sm:gap-[18px] justify-center w-full">
        {STATS.map((stat, idx) => (
            <Flex
                key={idx}
                vertical
                align="center"
                justify="center"
                className="rounded-[21px] overflow-hidden py-4 sm:py-[26px] gap-3 sm:gap-4 flex-1 relative min-h-[165px] sm:min-h-[195px]"
                style={{
                    minWidth: 0,
                    maxWidth: 213,
                    background:
                        'radial-gradient(ellipse 90% 70% at 50% 100%, #ffeaea 0%, #fff5f5 45%, #fff9f9 80%)',
                }}
            >
                {stat.decorations.map((d, i) => (
                    <img
                        key={i}
                        src={d.src}
                        alt=""
                        aria-hidden
                        className={`${d.className} pointer-events-none select-none`}
                    />
                ))}
                <div className="text-center px-2 sm:px-4 relative z-10">
                    <Text className="!block !text-[14px] sm:!text-[18px] !font-semibold !text-[#1e293b] tracking-[-0.18px]">
                        {stat.title}
                    </Text>
                    <div className="mt-[1px]">
                        <Text className="!text-[11px] sm:!text-[13px] !text-[#64748b] !font-normal">
                            {stat.subtitle}
                        </Text>
                    </div>
                </div>
                <img
                    src={stat.img}
                    alt={stat.title}
                    className="w-full object-contain px-3 sm:px-5 relative z-10"
                    style={{ maxHeight: 80 }}
                />
            </Flex>
        ))}
    </div>
);

export default HeroStats;
