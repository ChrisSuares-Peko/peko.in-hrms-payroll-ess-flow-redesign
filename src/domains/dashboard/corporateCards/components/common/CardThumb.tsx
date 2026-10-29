import { EyeOutlined } from '@ant-design/icons';

import indiaGate from '../../assets/india-gate.svg';
import pekoLogo from '../../assets/peko-card-logo.svg';
import rupay from '../../assets/rupay.png';
import { cn } from '../../utils/cn';

/**
 * Branded maroon mini-card thumbnail for card/transaction table rows: Peko + RuPay marks
 * over the India Gate watermark, with a masked number and a view-number eye at the foot.
 * Decorative (the real masked number sits beside it). Inner elements use container-query
 * units so the whole face scales proportionally with the thumbnail width.
 */
const CardThumb = ({ className }: { className?: string }) => (
    <span
        aria-hidden
        className={cn(
            'relative block aspect-[1.6] w-12 shrink-0 overflow-hidden rounded shadow-sm [container-type:inline-size]',
            'bg-[radial-gradient(circle_at_30%_20%,#ba2c2c,#5f1313_70%,#410b0b)]',
            className
        )}
    >
        <img
            src={indiaGate}
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 w-[75%] -translate-x-1/2 -translate-y-1/2 opacity-80"
        />
        <span className="absolute inset-0 flex flex-col justify-between p-[7cqw]">
            <span className="flex items-start justify-between gap-[4cqw]">
                <img src={pekoLogo} alt="" className="h-[6cqw] w-auto" />
                <img src={rupay} alt="" className="h-[6cqw] w-auto" />
            </span>
            <span className="flex items-center gap-[3cqw] text-white/80">
                <span className="whitespace-nowrap text-[5cqw] leading-none tracking-wide">
                    **** **** **** ****
                </span>
                <EyeOutlined className="text-[5cqw]" />
            </span>
        </span>
    </span>
);

export default CardThumb;
