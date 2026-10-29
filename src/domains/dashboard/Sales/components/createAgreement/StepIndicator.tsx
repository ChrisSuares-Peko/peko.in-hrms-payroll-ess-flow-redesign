import { Flex, Typography, Image } from 'antd';

import tickCircle from '../../assets/icons/tick-circle.svg';

const TOTAL_STEPS = 5;

const StepIndicator = ({ current }: { current: number }) => (
    <Flex align="center" justify="space-between" className="py-4 px-4 sm:py-6 sm:px-10">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const step = i + 1;
            const isActive = step === current;
            const isDone = step < current;

            return (
                <Flex key={step} align="center" className="flex-1 last:flex-none">
                    {/* Step circle */}
                    <Flex
                        justify="center"
                        align="center"
                        className="shrink-0 rounded-full"
                        style={{
                            width: 44,
                            height: 44,
                            // eslint-disable-next-line no-nested-ternary
                            backgroundColor: isDone
                                ? '#F0FDF4'
                                : isActive
                                  ? 'rgba(255,79,79,0.10)'
                                  : '#F4F4F5',
                        }}
                    >
                        {/* Inner circle */}
                        <Flex
                            justify="center"
                            align="center"
                            className="rounded-full"
                            style={{
                                width: 36,
                                height: 36,
                                backgroundColor: isActive ? '#FF4F4F' : '#fff',
                            }}
                        >
                            {isDone ? (
                                <Image
                                    src={tickCircle}
                                    alt="Tick Circle"
                                    width={24}
                                    height={24}
                                    preview={false}
                                />
                            ) : (
                                <Typography.Text
                                    className="text-sm font-semibold leading-none"
                                    style={{ color: isActive ? '#fff' : '#A1A1AA' }}
                                >
                                    {step}
                                </Typography.Text>
                            )}
                        </Flex>
                    </Flex>

                    {/* Connector */}
                    {step < TOTAL_STEPS && (
                        <div
                            className="flex-1 h-px mx-2"
                            style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                        />
                    )}
                </Flex>
            );
        })}
    </Flex>
);

export default StepIndicator;
