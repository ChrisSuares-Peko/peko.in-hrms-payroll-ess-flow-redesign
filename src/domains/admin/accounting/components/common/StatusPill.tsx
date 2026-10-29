import { PillTone } from '../../utils/commission';

const toneClasses: Record<PillTone, string> = {
    success: 'bg-green-50 text-green-700',
    warning: 'bg-bgLightYellow text-amber-700',
    neutral: 'bg-gray-100 text-textBody',
    danger: 'bg-bgLightRed text-red-700',
};

const StatusPill = ({ label, tone }: { label: string; tone: PillTone }) => (
    <span
        className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium ${toneClasses[tone]}`}
    >
        {label}
    </span>
);

export default StatusPill;
