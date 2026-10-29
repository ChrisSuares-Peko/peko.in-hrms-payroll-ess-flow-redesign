import { Fragment } from 'react';

interface StepProgressProps {
    steps: string[];
    currentStep: number;
}

// Numbered step indicator — copied from BusinessRegistration's own
// components/StepProgress.tsx (same visual template, entity-agnostic) rather
// than importing across domains, so nothing there needs touching if this one
// changes. Active/completed circles are red, upcoming ones are grey. Labels
// sit beneath each circle. Unlike the original, the connector between circles
// is a fixed width rather than flex-1 — that original stretches to fill a
// 600px-wide row regardless of step count, which looks fine split five ways
// but absurdly long with only two steps (this flow's case).
const StepProgress = ({ steps, currentStep }: StepProgressProps) => (
    <div className="flex items-start justify-center w-full">
        {steps.map((label, index) => {
            const isDone = index <= currentStep;
            const isActive = index === currentStep;
            return (
                <Fragment key={label}>
                    <div className="flex flex-col items-center gap-3 shrink-0 w-[88px]">
                        <div
                            className={`flex items-center justify-center w-[38px] h-[38px] rounded-full border text-[14px] ${
                                isDone
                                    ? 'bg-[#ff4f4f] text-white border-[rgba(0,0,0,0.06)]'
                                    : 'bg-[#f5f5f5] text-[#8d8d8d] border-[rgba(0,0,0,0.06)]'
                            }`}
                        >
                            {index + 1}
                        </div>
                        <span
                            className={`text-[12px] sm:text-[14px] text-center tracking-[0.14px] leading-tight ${
                                isActive ? 'text-[#0b0b0b]' : 'text-[#8d8d8d]'
                            }`}
                        >
                            {label}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div
                            className={`w-[60px] sm:w-[100px] h-px mt-[19px] ${
                                index < currentStep ? 'bg-[#ff4f4f]' : 'bg-[#e5e5e5]'
                            }`}
                        />
                    )}
                </Fragment>
            );
        })}
    </div>
);

export default StepProgress;
