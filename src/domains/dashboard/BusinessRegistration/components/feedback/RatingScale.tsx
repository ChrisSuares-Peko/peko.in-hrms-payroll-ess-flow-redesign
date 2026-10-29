import rating1 from '../../assets/feedback/rating-1-terrible.svg';
import rating2 from '../../assets/feedback/rating-2-poor.svg';
import rating3 from '../../assets/feedback/rating-3-average.svg';
import rating4 from '../../assets/feedback/rating-4-good.svg';
import rating5 from '../../assets/feedback/rating-5-excellent.svg';

// The 5-point RM rating scale (Figma 3951:30905): colour-coded emoji cards.
interface RatingOption {
    value: number;
    label: string;
    icon: string;
    bg: string;
    border: string;
}

const OPTIONS: RatingOption[] = [
    { value: 1, label: 'Terrible', icon: rating1, bg: '#fef2f2', border: '#fecaca' },
    { value: 2, label: 'Poor', icon: rating2, bg: '#fff7ed', border: '#fed7aa' },
    { value: 3, label: 'Average', icon: rating3, bg: '#fffbeb', border: '#fde68a' },
    { value: 4, label: 'Good', icon: rating4, bg: '#f0fdf4', border: '#bbf7d0' },
    { value: 5, label: 'Excellent', icon: rating5, bg: '#ecfdf5', border: '#a7f3d0' },
];

interface RatingScaleProps {
    value: number | null;
    onChange: (value: number) => void;
}

// Selected state (Figma 3959:31094): picked card keeps colour + shadow; rest dim.
const RatingScale = ({ value, onChange }: RatingScaleProps) => {
    const hasSelection = value !== null;
    return (
        <div className="flex gap-2 sm:gap-4 w-full">
            {OPTIONS.map(opt => {
                const active = value === opt.value;
                const dimmed = hasSelection && !active;
                const textColor = active ? '#030303' : '#686868';
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        aria-pressed={active}
                        style={{
                            backgroundColor: opt.bg,
                            borderColor: opt.border,
                            opacity: dimmed ? 0.3 : 1,
                            boxShadow: active ? '0px 7px 4.5px rgba(0,0,0,0.08)' : undefined,
                        }}
                        className="flex-1 min-w-0 flex flex-col items-center justify-center gap-2 pt-3 pb-2 px-2 sm:px-4 rounded-[12px] border transition-all cursor-pointer hover:shadow-[0px_7px_14px_rgba(0,0,0,0.10)]"
                    >
                        <img src={opt.icon} alt={opt.label} className="w-[35px] h-[35px]" />
                        <span className="text-[18px] leading-none" style={{ color: textColor }}>
                            {opt.value}
                        </span>
                        <span
                            className="text-[13px] sm:text-[14px] leading-none"
                            style={{ color: textColor }}
                        >
                            {opt.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default RatingScale;
