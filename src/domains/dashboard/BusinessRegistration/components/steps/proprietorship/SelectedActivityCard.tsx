import { CloseOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

import { activityLevels, NicOption } from '../../../utils/nic';

const { Text } = Typography;

interface SelectedActivityCardProps {
    activity: NicOption;
    // 1-based ordinal shown in the header badge.
    index: number;
    onRemove: () => void;
}

// One selected NIC activity (Figma 1848:27752) — Level 3 "You selected" plus the
// auto-mapped Level 2 and Level 1 rows.
const SelectedActivityCard = ({ activity, index, onRemove }: SelectedActivityCardProps) => {
    const rows = activityLevels(activity);

    return (
        <div className="bg-[#fffcfc] border border-[#ffeaea] rounded-[24px] p-4 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <Text className="!text-[16px] !text-[#1e293b]">Activity</Text>
                    <span className="bg-[#fff3f3] rounded-[80px] px-[7px] text-[14px] text-[#ff4f4f]">
                        {index}
                    </span>
                </div>
                <button type="button" onClick={onRemove} aria-label="Remove activity" className="text-[#94a3b8] hover:text-[#ff4f4f] transition-colors">
                    <CloseOutlined style={{ fontSize: 18 }} />
                </button>
            </div>

            <div className="flex flex-col gap-2">
                {rows.map((row, i) => (
                    <div
                        key={row.level}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 ${
                            i < rows.length - 1 ? 'border-b-[0.5px] border-[#e7e7e7] pb-3' : ''
                        }`}
                    >
                        <div className="flex items-center gap-1 shrink-0">
                            <span
                                className={`w-[88px] text-center px-2 py-1 rounded-[8px] border-[0.5px] text-[14px] ${
                                    row.selected
                                        ? 'bg-[#fff8f8] border-[#ff4f4f] text-[rgba(0,0,0,0.85)]'
                                        : 'border-[#909090] text-[#909090]'
                                }`}
                            >
                                {row.level}
                            </span>
                            <Text className="!text-[12px] !text-[#c3c9e5]">{row.tag}</Text>
                        </div>
                        <Text className="!text-[14px] !text-[rgba(0,0,0,0.85)] min-w-0 sm:text-right">
                            {row.label}
                        </Text>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SelectedActivityCard;
