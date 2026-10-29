import { Fragment } from 'react';

interface StepProgressProps {
    steps: string[];
    currentStep: number;
}

// Numbered step indicator (Figma 1773:23934). Active/completed circles are red,
// upcoming ones grey. Per-step labels show on sm+; on mobile the row would be too
// wide (fixed-width steps overflow and clip the active one), so labels collapse to
// a single "Step X of Y — label" line beneath the circles.
const StepProgress = ({ steps, currentStep }: StepProgressProps) => (
    <div className="flex flex-col gap-2 w-full max-w-[600px] mx-auto">
        <div className="flex items-start justify-center w-full">
            {steps.map((label, index) => {
                const isDone = index <= currentStep;
                const isActive = index === currentStep;
                return (
                    <Fragment key={label}>
                        <div className="flex flex-col items-center gap-3 shrink-0 w-[36px] sm:w-[88px]">
                            <div
                                className={`flex items-center justify-center w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] rounded-full border text-[13px] sm:text-[14px] ${
                                    isDone
                                        ? 'bg-[#ff4f4f] text-white border-[rgba(0,0,0,0.06)]'
                                        : 'bg-[#f5f5f5] text-[#8d8d8d] border-[rgba(0,0,0,0.06)]'
                                }`}
                            >
                                {index + 1}
                            </div>
                            <span
                                className={`hidden sm:block text-[14px] text-center tracking-[0.14px] leading-tight ${
                                    isActive ? 'text-[#0b0b0b]' : 'text-[#8d8d8d]'
                                }`}
                            >
                                {label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-px mt-[15px] sm:mt-[19px] min-w-[8px] sm:min-w-[20px] ${
                                    index < currentStep ? 'bg-[#ff4f4f]' : 'bg-[#e5e5e5]'
                                }`}
                            />
                        )}
                    </Fragment>
                );
            })}
        </div>
        {/* Mobile: the active step's label (per-step labels are hidden above). */}
        <span className="sm:hidden text-[13px] text-center text-[#0b0b0b] tracking-[0.14px]">
            Step {currentStep + 1} of {steps.length} — {steps[currentStep]}
        </span>
    </div>
);

export default StepProgress;
