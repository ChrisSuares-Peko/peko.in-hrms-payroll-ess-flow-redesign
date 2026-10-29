import { useEffect, useState } from 'react';

import { ClockCircleOutlined, EnvironmentFilled, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Flex, Typography } from 'antd';

import PunchModal from './PunchModal';
import tickCircle from '../../assets/icons/tick-circle.svg';
import { DashboardProfile } from '../../types';
import { formatHours } from '../../utils/attendanceMappers';

interface ProfileCardProps {
    profile: DashboardProfile;
    checkInLoading: boolean;
    checkOutLoading: boolean;
    onCheckIn: () => void;
    onCheckOut: () => void;
}

const formatToday = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const formatClock = (iso?: string): string => {
    if (!iso) return '--:--';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatElapsed = (ms: number): string => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map(n => n.toString().padStart(2, '0')).join(':');
};

const formatLate = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m late` : `${m}m late`;
};

const ProfileCard = ({
    profile,
    checkInLoading,
    checkOutLoading,
    onCheckIn,
    onCheckOut,
}: ProfileCardProps) => {
    const [punchModalOpen, setPunchModalOpen] = useState(false);

    const {
        isCheckedIn,
        isCheckedOut,
        isLate,
        lateMinutes,
        shiftComplete,
        checkInTime,
        totalHours,
        checkInOutEnabled,
        isCheckInAvailable,
        checkInUnavailableReason,
    } = profile;
    const onTheClock = isCheckedIn && !isCheckedOut;
    const canCheckIn = checkInOutEnabled && isCheckInAvailable;
    let checkInHint = '';
    if (!checkInOutEnabled) checkInHint = 'Check-in is disabled by your organization';
    else if (!isCheckInAvailable)
        checkInHint = checkInUnavailableReason || "Check-in isn't available today";

    const [nowMs, setNowMs] = useState(() => Date.now());
    useEffect(() => {
        if (!onTheClock || !checkInTime) return undefined;
        setNowMs(Date.now());
        const id = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(id);
    }, [onTheClock, checkInTime]);

    const elapsed = checkInTime
        ? formatElapsed(nowMs - new Date(checkInTime).getTime())
        : '00:00:00';
    const mode: 'in' | 'out' = onTheClock ? 'out' : 'in';
    const loading = onTheClock ? checkOutLoading : checkInLoading;

    return (
        <Flex
            vertical
            className="h-full p-3 bg-white rounded-[32px] shadow-[0px_1.66px_8.28px_rgba(0,0,0,0.06)]"
        >
            <Flex vertical className="mx-3 p-5 border border-solid rounded-[26px] border-[#e6e6e6]">
                <Flex
                    vertical
                    align="center"
                    gap={6}
                    className="pb-4 border-b border-solid border-[#ededed]"
                >
                    <Avatar size={48} src={profile.avatar} icon={<UserOutlined />} />
                    <Typography.Text className="text-[18px] font-medium text-black">
                        {profile.name}
                    </Typography.Text>
                    <Typography.Text className="text-sm text-center text-[#616161]">
                        {profile.designation}
                    </Typography.Text>
                </Flex>

                <Flex justify="space-between" gap={27} className="w-full pt-4">
                    <Flex vertical gap={4} className="flex-1">
                        <Typography.Text className="text-base font-medium text-[#080808]">
                            {profile.employeeId}
                        </Typography.Text>
                        <Typography.Text className="text-[12px] text-[#9e9e9e]">
                            Employee ID
                        </Typography.Text>
                    </Flex>
                    <Flex vertical gap={4} className="flex-1">
                        <Typography.Text className="text-base font-medium text-[#080808]">
                            {profile.department}
                        </Typography.Text>
                        <Typography.Text className="text-[12px] text-[#9e9e9e]">
                            Department
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Flex>

            <Flex className="px-3 py-5">
                {(() => {
                    if (onTheClock) {
                        const accent = isLate ? '#B78912' : '#43B75D';
                        const boxBg = isLate ? '#FFFAEB' : '#eaf9f0';
                        return (
                            <Flex
                                align="center"
                                justify="space-between"
                                className="w-full rounded-2xl px-4 py-3"
                                style={{ backgroundColor: boxBg }}
                            >
                                <Flex align="center" gap={12}>
                                    <EnvironmentFilled
                                        className="text-lg"
                                        style={{ color: accent }}
                                    />
                                    <Flex vertical gap={2}>
                                        <Typography.Text
                                            className="text-base font-semibold"
                                            style={{ color: accent }}
                                        >
                                            {isLate ? 'Checked In Late' : 'Checked In On Time'}
                                        </Typography.Text>
                                        <Flex align="center" gap={5}>
                                            <ClockCircleOutlined className="text-[#1d1d1d] text-xs" />
                                            <Typography.Text className="text-xs text-[#1d1d1d]">
                                                In {formatClock(checkInTime)}
                                            </Typography.Text>
                                            {isLate && lateMinutes ? (
                                                <Typography.Text
                                                    className="text-xs font-semibold"
                                                    style={{ color: accent }}
                                                >
                                                    · {formatLate(lateMinutes)}
                                                </Typography.Text>
                                            ) : null}
                                        </Flex>
                                    </Flex>
                                </Flex>
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="bg-white rounded-lg px-3 py-1"
                                >
                                    <Typography.Text
                                        className="text-sm font-semibold tabular-nums"
                                        style={{ color: accent }}
                                    >
                                        {elapsed}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        );
                    }
                    if (isCheckedOut) {
                        return (
                            <Flex
                                align="center"
                                justify="space-between"
                                className="w-full rounded-2xl bg-[#f5f6f7] px-4 py-3"
                            >
                                <Flex align="center" gap={12}>
                                    {shiftComplete ? (
                                        <img src={tickCircle} alt="" className="w-6 h-6" />
                                    ) : (
                                        <ClockCircleOutlined className="text-[#8a94a6] text-xl" />
                                    )}
                                    <Flex vertical gap={2}>
                                        <Typography.Text
                                            className={`text-base font-semibold ${shiftComplete ? 'text-[#43B75D]' : 'text-[#1e293b]'}`}
                                        >
                                            {shiftComplete ? 'Shift Complete' : 'Checked Out'}
                                        </Typography.Text>
                                        {shiftComplete && (
                                            <Typography.Text className="text-xs text-[#8a94a6]">
                                                Great work today!
                                            </Typography.Text>
                                        )}
                                    </Flex>
                                </Flex>
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="bg-white rounded-lg px-3 py-1"
                                >
                                    <Typography.Text className="text-sm text-[#8a94a6]">
                                        Total:{' '}
                                        <span className="font-semibold text-[#1e293b]">
                                            {formatHours(totalHours) ?? '0h 00m'}
                                        </span>
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        );
                    }
                    return (
                        <Flex
                            align="center"
                            gap={12}
                            className="w-full rounded-2xl bg-[#F7F7F7] px-4 py-3"
                        >
                            <EnvironmentFilled className="text-[#ff4f4f] text-xl" />
                            <Flex vertical>
                                <Typography.Text className="text-base font-medium text-[#080808]">
                                    Not Checked In
                                </Typography.Text>
                                <Typography.Text className="text-sm text-[#1d1d1d]">
                                    {formatToday(profile.today)}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    );
                })()}
            </Flex>

            <Flex vertical gap={6} className="px-3 pb-3 mt-auto">
                {(() => {
                    if (onTheClock) {
                        return (
                            <Button
                                block
                                loading={loading}
                                disabled={!checkInOutEnabled}
                                onClick={() => setPunchModalOpen(true)}
                                className="h-11 rounded-md font-medium"
                                style={
                                    checkInOutEnabled
                                        ? { color: '#FF4F4F', borderColor: '#FF4F4F' }
                                        : undefined
                                }
                            >
                                Check Out
                            </Button>
                        );
                    }
                    if (isCheckedOut) {
                        return (
                            <Button block disabled className="h-11 rounded-md font-medium">
                                Check In
                            </Button>
                        );
                    }
                    return (
                        <Button
                            type="primary"
                            block
                            loading={loading}
                            disabled={!canCheckIn}
                            onClick={() => setPunchModalOpen(true)}
                            className="h-11 rounded-md font-medium"
                            style={
                                canCheckIn
                                    ? { backgroundColor: '#FF4F4F', borderColor: '#FF4F4F' }
                                    : undefined
                            }
                        >
                            Check In
                        </Button>
                    );
                })()}
                {checkInHint && (
                    <Typography.Text className="text-xs text-center text-[#9e9e9e]">
                        {checkInHint}
                    </Typography.Text>
                )}
            </Flex>

            <PunchModal
                open={punchModalOpen}
                mode={mode}
                loading={loading}
                onClose={() => setPunchModalOpen(false)}
                onConfirm={() => {
                    if (onTheClock) onCheckOut();
                    else onCheckIn();
                    setPunchModalOpen(false);
                }}
            />
        </Flex>
    );
};

export default ProfileCard;
