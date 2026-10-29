import React from 'react';

import { CheckOutlined } from '@ant-design/icons';

const STEP_TITLES = ['Select Visa', 'Travelers Details and Documents', 'Review & Pay'];

const COLOR_GREEN = '#43B75D';
const COLOR_GREY = '#8C8C8C';
const COLOR_GREY_LINE = '#E2E0EB';

interface VisaProgressStepsProps {
    currentStep: 0 | 1 | 2;
}

// Renders finish/process/wait states as filled-check / green-outline-number / grey-outline-number
// circles respectively — antd's <Steps> default icon rendering was overridden per-item with a
// checkmark icon regardless of status, which is why every step used to show a green tick.
const VisaProgressSteps: React.FC<VisaProgressStepsProps> = ({ currentStep }) => (
    <div className="w-full overflow-x-auto">
        <div className="flex w-full items-center px-2">
            {STEP_TITLES.map((title, index) => {
                let status: 'finish' | 'process' | 'wait' = 'wait';
                if (index < currentStep) status = 'finish';
                else if (index === currentStep) status = 'process';
                const accentColor = status === 'process' ? COLOR_GREEN : COLOR_GREY;

                return (
                    <React.Fragment key={title}>
                        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                            <div
                                className="flex shrink-0 items-center justify-center rounded-full"
                                style={{
                                    width: 24,
                                    height: 24,
                                    background: status === 'finish' ? COLOR_GREEN : '#FFFFFF',
                                    border: status === 'finish' ? 'none' : `1px solid ${accentColor}`,
                                }}
                            >
                                {status === 'finish' ? (
                                    <CheckOutlined style={{ color: '#FFFFFF', fontSize: 10 }} />
                                ) : (
                                    <span style={{ fontSize: 12, fontWeight: 500, color: accentColor }}>
                                        {index + 1}
                                    </span>
                                )}
                            </div>
                            <span
                                className="whitespace-nowrap"
                                style={{
                                    fontSize: 12,
                                    color: status === 'wait' ? COLOR_GREY : '#000000',
                                    fontWeight: status === 'process' ? 500 : 400,
                                }}
                            >
                                {title}
                            </span>
                        </div>
                        {index < STEP_TITLES.length - 1 && (
                            <div className="mx-2.5 min-w-[20px] flex-1">
                                <div
                                    className="h-[2px] w-full"
                                    style={{ background: status === 'finish' ? COLOR_GREEN : COLOR_GREY_LINE }}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    </div>
);

export default VisaProgressSteps;
