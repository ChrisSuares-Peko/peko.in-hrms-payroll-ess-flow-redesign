import { useEffect } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import Lottie from 'react-lottie';

import couponAppliedAnimation from '@assets/animation/coupon-applied.json';

interface CouponAppliedPopupProps {
    open: boolean;
    couponCode: string;
    onClose: () => void;
}

// The animation's motion finishes at frame 76 of 116 (25fps), so close just after that rather
// than sitting on the static tail — or cutting the check off before it lands.
const AUTO_CLOSE_MS = 3400;

const lottieOptions = {
    loop: false,
    autoplay: true,
    animationData: couponAppliedAnimation,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
    },
};

const CONFETTI_DOTS = [
    { left: '8%', delay: '0ms', color: '#FF4F4F' },
    { left: '22%', delay: '120ms', color: '#FFC700' },
    { left: '38%', delay: '40ms', color: '#08A055' },
    { left: '54%', delay: '200ms', color: '#3B82F6' },
    { left: '70%', delay: '80ms', color: '#FF4F4F' },
    { left: '84%', delay: '160ms', color: '#FFC700' },
    { left: '95%', delay: '60ms', color: '#08A055' },
];

const CouponAppliedPopup = ({ open, couponCode, onClose }: CouponAppliedPopupProps) => {
    useEffect(() => {
        if (!open) return undefined;
        const timer = setTimeout(onClose, AUTO_CLOSE_MS);
        return () => clearTimeout(timer);
    }, [open, onClose]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closeIcon={null}
            centered
            width={320}
            destroyOnClose
            styles={{ body: { padding: 0 } }}
            className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-2xl"
        >
            <div className="relative flex animate-pop-in flex-col items-center gap-1 overflow-hidden px-6 pb-7 pt-6 text-center motion-reduce:animate-none">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed"
                >
                    <CloseOutlined className="text-xs" />
                </button>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-20 overflow-hidden motion-reduce:hidden"
                >
                    {CONFETTI_DOTS.map((dot, index) => (
                        <span
                            key={index}
                            className="absolute top-0 h-2 w-2 animate-confetti-fall rounded-full"
                            style={{
                                left: dot.left,
                                backgroundColor: dot.color,
                                animationDelay: dot.delay,
                            }}
                        />
                    ))}
                </div>

                <div className="flex h-32 w-32 items-center justify-center">
                    <Lottie
                        options={lottieOptions}
                        height={128}
                        width={128}
                        isClickToPauseDisabled
                    />
                </div>

                <h3 className="text-lg font-bold text-slate-900">Coupon Applied!</h3>
                <p className="text-sm text-slate-500">
                    <span className="font-semibold text-lightRed">{couponCode}</span> has been
                    applied successfully. Enjoy your savings!
                </p>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 w-full rounded-lg bg-lightRed py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed focus-visible:ring-offset-2"
                >
                    Awesome!
                </button>
            </div>
        </Modal>
    );
};

export default CouponAppliedPopup;
