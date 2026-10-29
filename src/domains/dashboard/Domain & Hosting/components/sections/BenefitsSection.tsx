import { Typography } from 'antd';

const { Title, Text } = Typography;

interface Benefit {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface BenefitsSectionProps {
    osTitle: string;
    hostingBenefits: Benefit[];
}

export const BenefitsSection = ({ osTitle, hostingBenefits }: BenefitsSectionProps) => (
    <div className="mb-2 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 max-w-7xl mx-auto">
        <Title
            level={3}
            style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                fontSize: '28px',
                lineHeight: '38px',
                color: '#1E293B',
                marginTop: 0,
                marginBottom: '20px',
            }}
        >
            Why choose {osTitle}
        </Title>
        <div
            className="p-6 sm:p-8 lg:py-14 lg:px-12 bg-white"
            style={{
                boxShadow: '0px 2px 20px rgba(0, 0, 0, 0.06)',
                borderRadius: '28px',
            }}
        >
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-5 lg:gap-x-4 lg:gap-y-12">
                {hostingBenefits.map((benefit, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center gap-[10px] px-2 text-center"
                    >
                        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
                            {benefit.icon}
                        </span>
                        <div className="flex w-full flex-col items-center gap-[6px]">
                            <Text
                                style={{
                                    fontFamily: 'Roboto, sans-serif',
                                    fontWeight: 500,
                                    fontSize: '16px',
                                    lineHeight: '26px',
                                    color: '#1E293B',
                                    textAlign: 'center',
                                    display: 'block',
                                    width: '100%',
                                }}
                            >
                                {benefit.title}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Roboto, sans-serif',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    lineHeight: '22px',
                                    color: '#6F6C8F',
                                    textAlign: 'center',
                                    display: 'block',
                                    maxWidth: '160px',
                                    margin: '0 auto',
                                }}
                            >
                                {benefit.description}
                            </Text>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
