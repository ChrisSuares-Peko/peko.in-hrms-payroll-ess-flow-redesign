import { Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import { Passenger } from '../../types/slices';

export type AddonSummaryRow = {
    key: string;
    icon: string;
    label: string;
    value: string;
};

type Props = {
    passenger: Passenger;
    rows: AddonSummaryRow[];
};

const getInitials = (passenger: Passenger) =>
    `${passenger.FirstName?.[0] || ''}${passenger.LastName?.[0] || ''}`.toUpperCase();

const getPassportText = (passenger: Passenger) => {
    if (!passenger.PassportNo) return '';
    const masked = `${passenger.PassportNo.slice(0, 5)}•••`;
    const expiry = dayjs(passenger.PassportExpiry);
    return expiry.isValid()
        ? `Passport: ${masked} | Expiry: ${expiry.format('MM/YYYY')}`
        : `Passport: ${masked}`;
};

const PassengerAddonSummary = ({ passenger, rows }: Props) => {
    const passportText = getPassportText(passenger);

    return (
        <Flex
            vertical
            gap={14}
            className="flex-1 min-w-0 p-[22px] bg-white rounded-[20px] border border-solid border-slate-200"
        >
            <Flex align="center" gap={12}>
                <Flex
                    align="center"
                    justify="center"
                    className="size-10 shrink-0 rounded-[20px] bg-slate-100 border border-solid border-slate-200 text-sm font-bold text-slate-900"
                >
                    {getInitials(passenger)}
                </Flex>
                <Flex vertical gap={7} className="min-w-0">
                    <Typography.Text className="text-base font-semibold text-slate-900 truncate">
                        {`${passenger.FirstName} ${passenger.LastName}`}
                    </Typography.Text>
                    {passportText && (
                        <Typography.Text className="text-sm text-slate-500">
                            {passportText}
                        </Typography.Text>
                    )}
                </Flex>
            </Flex>
            <div className="h-px w-full bg-slate-200" />
            <Flex vertical gap={10}>
                <Typography.Text className="text-xs font-medium uppercase text-slate-500">
                    Add-ons details
                </Typography.Text>
                <Flex vertical gap={8}>
                    {rows.map(row => (
                        <Flex
                            key={row.key}
                            align="center"
                            gap={10}
                            className="p-[14px] rounded-xl bg-slate-50 border-[0.6px] border-solid border-slate-200"
                        >
                            <Flex
                                align="center"
                                justify="center"
                                className="size-[37px] shrink-0 rounded-lg bg-indigo-100"
                            >
                                <img src={row.icon} alt="" className="size-[19px]" />
                            </Flex>
                            <Flex vertical gap={5} className="min-w-0">
                                <Typography.Text className="text-xs font-medium uppercase text-slate-500">
                                    {row.label}
                                </Typography.Text>
                                <Typography.Text
                                    className={`text-sm font-semibold ${row.value ? 'text-slate-900' : 'text-slate-400'}`}
                                >
                                    {row.value || 'Not selected'}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </Flex>
    );
};

export default PassengerAddonSummary;
