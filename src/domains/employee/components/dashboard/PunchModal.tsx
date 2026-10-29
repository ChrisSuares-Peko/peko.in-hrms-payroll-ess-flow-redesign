import { useEffect, useState } from 'react';

import { Button, Flex, Modal, Typography } from 'antd';

import './PunchModal.css';
import exitIcon from '../../assets/icons/exit.svg';
import locationIcon from '../../assets/icons/location.svg';

type PunchMode = 'in' | 'out';

interface PunchModalProps {
    open: boolean;
    mode: PunchMode;
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const CONFIG: Record<
    PunchMode,
    { title: string; subtitle: string; cta: string; icon: string; outer: string; inner: string }
> = {
    in: {
        title: 'Start Your Shift?',
        subtitle: 'Location verified. Confirm your attendance for today?',
        cta: 'Check In',
        icon: locationIcon,
        outer: '#DCF5E8',
        inner: '#2BC48A',
    },
    out: {
        title: 'End Your Shift?',
        subtitle: 'This will log your check-out time and close your shift.',
        cta: 'Check Out',
        icon: exitIcon,
        outer: '#FFE3E3',
        inner: '#FF4F4F',
    },
};

const formatTime = (d: Date): string =>
    d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

// Confirmation modal for the dashboard attendance punch (check-in / check-out).
const PunchModal = ({ open, mode, loading, onClose, onConfirm }: PunchModalProps) => {
    const config = CONFIG[mode];

    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        if (!open) return undefined;
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, [open]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={520}
            rootClassName="employee-portal-modal"
            styles={{ content: { borderRadius: 24, padding: 40, overflow: 'hidden' } }}
        >
            <Flex vertical align="center" gap={20}>
                <Flex
                    align="center"
                    justify="center"
                    className="w-[88px] h-[88px] rounded-full"
                    style={{ backgroundColor: config.outer }}
                >
                    <Flex
                        align="center"
                        justify="center"
                        className="w-[52px] h-[52px] rounded-full"
                        style={{ backgroundColor: config.inner }}
                    >
                        <img src={config.icon} alt="" className="w-6 h-6" />
                    </Flex>
                </Flex>

                <Flex vertical align="center" gap={6} className="text-center">
                    <Typography.Text className="text-[26px] font-bold text-[#1e293b] leading-tight">
                        {config.title}
                    </Typography.Text>
                    <Typography.Text className="text-[#64748b] text-base">
                        {config.subtitle}
                    </Typography.Text>
                </Flex>

                <Flex
                    align="center"
                    justify="center"
                    className="w-full bg-[#fff6f4] rounded-2xl py-7"
                >
                    <Typography.Text className="text-[44px] font-medium text-[#1e293b] tracking-wider tabular-nums punch-modal-timer">
                        {formatTime(now)}
                    </Typography.Text>
                </Flex>

                <Flex gap={14} className="w-full">
                    <Button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 h-[56px] rounded-xl font-semibold text-[#475569]"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        loading={loading}
                        onClick={onConfirm}
                        className="flex-1 h-[56px] rounded-xl font-semibold"
                        style={{ backgroundColor: '#FF4F4F', borderColor: '#FF4F4F' }}
                    >
                        {config.cta}
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default PunchModal;
