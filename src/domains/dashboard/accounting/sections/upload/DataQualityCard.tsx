import { Flex, Progress, Typography } from 'antd';

import { dataQuality } from '../../utils/uploadData';

const { Text } = Typography;

export interface QualityData {
    score: number;
    capturedLabel: string;
    counts: { clean: number; warning: number; error: number };
    aiNote: { prefix: string; highlight: string; suffix: string };
}

interface DataQualityCardProps {
    data?: QualityData;
}

const DataQualityCard = ({ data = dataQuality }: DataQualityCardProps) => (
    <Flex
        gap={20}
        className="w-full flex-col items-center rounded-[22px] border border-borderStrong bg-surfaceGray p-6 sm:flex-row"
    >
        <Flex vertical align="center" gap={8} className="shrink-0">
            <Progress
                type="circle"
                percent={data.score}
                size={88}
                strokeColor="#FF4F4F"
                trailColor="#FFE4E4"
                format={percent => (
                    <span className="text-lg font-medium text-danger">{percent}%</span>
                )}
            />
            <Text className="text-base font-medium text-bodyText">{dataQuality.label}</Text>
        </Flex>

        <Flex vertical gap={10} className="min-w-0 flex-1">
            <Text className="text-base font-medium text-bodyText sm:text-lg">
                {data.capturedLabel}
            </Text>
            <Flex gap={8} className="w-full flex-wrap">
                {dataQuality.chips.map(chip => (
                    <Flex
                        key={chip.key}
                        align="center"
                        justify="center"
                        className="min-w-[5.5rem] flex-1 basis-0 rounded-lg border px-2.5 py-2"
                        style={{ backgroundColor: chip.bg, borderColor: chip.border }}
                    >
                        <Text
                            className="whitespace-nowrap text-xs font-medium"
                            style={{ color: chip.color }}
                        >
                            {data.counts[chip.key]} {chip.label}
                        </Text>
                    </Flex>
                ))}
            </Flex>
            <Text className="text-xs text-slate-400">
                {data.aiNote.prefix}
                <span className="font-medium text-slate-600">{data.aiNote.highlight}</span>
                {(data.counts.warning > 0 || data.counts.error > 0) && (
                    <span className="font-medium text-danger">{data.aiNote.suffix}</span>
                )}
            </Text>
        </Flex>
    </Flex>
);

export default DataQualityCard;
