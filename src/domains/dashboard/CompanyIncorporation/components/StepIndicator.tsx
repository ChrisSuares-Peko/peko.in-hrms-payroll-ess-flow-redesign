import { CheckCircleFilled, CheckCircleOutlined } from '@ant-design/icons';

interface StepIndicatorProps {
    currentStep: number;
    entityType?: string;
}

const getSteps = (entityType?: string) => [
    'Basic Details',
    entityType === 'llp' ? 'Designated Partners & DSC/DIN' : 'Directors & DSC/DIN',
    'Capital & Shareholding',
    'Business Activity',
    entityType === 'llp' ? 'LLP Agreement' : 'MOA & AOA',
    'Document Uploads',
    'Review & Submit',
];

const StepIndicator = ({ currentStep, entityType }: StepIndicatorProps) => {
    const STEPS = getSteps(entityType);
    const total = STEPS.length;

    return (
        <>
            {/* Mobile (< md): compact step counter + name + progress bar */}
            <div className="flex md:hidden flex-col gap-2 mb-8">
                <div className="flex items-center justify-between">
                    <span className="text-[12px] font-normal text-slate-400">
                        Step {currentStep + 1} of {total}
                    </span>
                    <span className="text-[13px] font-semibold text-lightRed">
                        {STEPS[currentStep]}
                    </span>
                </div>
                <div className="h-[4px] w-full rounded-full bg-gray-200">
                    <div
                        className="h-full rounded-full bg-lightRed transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Tablet (md to xl): numbered circles + connecting lines + active step name */}
            <div className="hidden md:flex xl:hidden flex-col gap-3 mb-8">
                <div className="flex items-center w-full">
                    {STEPS.map((_, index) => {
                        const isCompleted = index < currentStep;
                        const isActive = index === currentStep;
                        let circleClass = 'bg-white border-2 border-gray-200';
                        if (isCompleted) circleClass = 'bg-lightRed';
                        else if (isActive) circleClass = 'bg-white border-2 border-lightRed';
                        return (
                            <div key={index} className="flex items-center flex-1 last:flex-none">
                                <div
                                    className={`flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 transition-all ${circleClass}`}
                                >
                                    {isCompleted ? (
                                        <CheckCircleFilled style={{ fontSize: 14, color: '#fff' }} />
                                    ) : (
                                        <span
                                            className={`text-[11px] font-semibold leading-none ${
                                                isActive ? 'text-lightRed' : 'text-slate-300'
                                            }`}
                                        >
                                            {index + 1}
                                        </span>
                                    )}
                                </div>
                                {index < total - 1 && (
                                    <div
                                        className={`flex-1 mx-1 rounded-full transition-all duration-300 ${
                                            index < currentStep
                                                ? 'h-[2px] bg-lightRed'
                                                : 'h-[1px] bg-gray-200'
                                        }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center justify-between px-1">
                    <span className="text-[12px] text-slate-400">
                        Step {currentStep + 1} of {total}
                    </span>
                    <span className="text-[13px] font-semibold text-lightRed">
                        {STEPS[currentStep]}
                    </span>
                </div>
            </div>

            {/* Desktop (xl+): full horizontal step list with labels */}
            <div className="hidden xl:flex w-full mb-12">
                {STEPS.map((label, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-[6px] px-3">
                                {isCompleted ? (
                                    <CheckCircleFilled style={{ fontSize: 22, color: '#FF4F4F' }} />
                                ) : (
                                    <CheckCircleOutlined
                                        style={{ fontSize: 22, color: isActive ? '#FF4F4F' : '#ccc' }}
                                    />
                                )}
                                <span
                                    className={`text-[13px] whitespace-nowrap leading-[20px] ${
                                        isActive || isCompleted
                                            ? 'font-medium text-lightRed'
                                            : 'font-normal text-[#ccc]'
                                    }`}
                                >
                                    {label}
                                </span>
                            </div>
                            <div
                                className={`w-full transition-all duration-300 ${
                                    isActive ? 'h-[2px] bg-lightRed' : 'h-[1px] bg-gray-200'
                                }`}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default StepIndicator;
