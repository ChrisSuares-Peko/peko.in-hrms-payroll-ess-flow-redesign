import { Flex, Typography, theme } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

type Props = {
    icon: string;
    title: string;
    price: number;
    isSelected: boolean;
    onAdd: () => void;
    onRemove: () => void;
};

const AddonOptionCard = ({ icon, title, price, isSelected, onAdd, onRemove }: Props) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();

    return (
        <Flex align="center" gap={8} className="w-full bg-white rounded-xl">
            <Flex
                align="center"
                justify="center"
                className="size-[60px] shrink-0 rounded-[18.75px] bg-[#f0f5fc]"
            >
                <img src={icon} alt="" className="size-[30px]" />
            </Flex>
            <Flex vertical gap={8} className="flex-1 min-w-0">
                <Typography.Text className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {title}
                </Typography.Text>
                <Typography.Text className="text-xs text-slate-500">
                    {Number(price) > 0 ? `₹ ${formatNumberWithLocalString(price)}` : 'Free'}
                </Typography.Text>
            </Flex>
            {isSelected ? (
                <button
                    type="button"
                    aria-label={`Remove ${title}`}
                    className="h-8 px-3 shrink-0 rounded-lg border-solid bg-white text-xs font-medium cursor-pointer"
                    style={{ borderWidth: 0.817, borderColor: colorPrimary, color: colorPrimary }}
                    onClick={onRemove}
                >
                    Remove
                </button>
            ) : (
                <button
                    type="button"
                    className="h-8 w-[53px] shrink-0 rounded-lg border-solid bg-white text-xs font-medium cursor-pointer"
                    style={{ borderWidth: 0.817, borderColor: colorPrimary, color: colorPrimary }}
                    onClick={onAdd}
                >
                    Add
                </button>
            )}
        </Flex>
    );
};

export default AddonOptionCard;
