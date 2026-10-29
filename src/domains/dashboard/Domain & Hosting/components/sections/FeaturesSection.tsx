import { Typography } from 'antd';

const { Text, Title } = Typography;

// Right-side feature image sizing. cPanel keeps its logo proportions; the rest share a
// consistent box, with "Boost website speed" nudged slightly smaller so it reads the same size.
const cardImageStyle = (title?: string): React.CSSProperties => {
    const t = title?.toLowerCase() ?? '';
    if (t.includes('cpanel')) return { maxWidth: '70%', maxHeight: '100%' };
    if (t.includes('boost')) return { width: '160px', height: '105px' };
    return { width: '180px', height: '120px' };
};

interface Feature {
    icon: React.ReactNode;
    title: string;
    cardTitle: string;
    cardDescription: string;
    cardImage?: string;
}

interface FeaturesSectionProps {
    featureTitleOs: string;
    hostingFeatures: Feature[];
    selectedFeature: number;
    onSelectFeature: (idx: number) => void;
    os: 'linux' | 'windows';
}

export const FeaturesSection = ({
    featureTitleOs,
    hostingFeatures,
    selectedFeature,
    onSelectFeature,
    os,
}: FeaturesSectionProps) => (
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
            {featureTitleOs} Features
        </Title>

        <div
            className="overflow-x-auto mt-10 mb-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <div
                className="flex flex-row items-start"
                style={{ minWidth: '600px' }}
            >
                {hostingFeatures.map((feature, idx) => (
                    <div
                        key={idx}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectFeature(idx)}
                        onKeyDown={e => e.key === 'Enter' && onSelectFeature(idx)}
                        className={`flex-1 flex flex-col justify-center items-center cursor-pointer ${selectedFeature === idx ? 'border-b-2 border-lightRed' : 'border-b-2 border-transparent'}`}
                        style={{
                            padding: os === 'linux' && idx === 0 ? '0' : '10px 8px',
                            gap: os === 'linux' && idx === 0 ? '0' : '6px',
                        }}
                    >
                        {feature.icon}
                        <Text
                            style={{
                                fontFamily: 'Roboto, sans-serif',
                                fontWeight: 500,
                                fontSize: '14px',
                                lineHeight: '22px',
                                color: '#1E293B',
                                textAlign: 'center',
                            }}
                        >
                            {feature.title}
                        </Text>
                    </div>
                ))}
            </div>
        </div>

        <div
            className="p-6 sm:p-10 lg:py-[60px] lg:px-[50px] bg-white flex flex-row flex-wrap justify-between items-start"
            style={{
                boxShadow: '0px 2px 20px rgba(0, 0, 0, 0.06)',
                borderRadius: '28px',
                gap: '50px',
            }}
        >
            <div
                className="flex flex-col items-start gap-2.5 flex-1"
                style={{ minWidth: '220px' }}
            >
                <Text
                    style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 500,
                        fontSize: '24px',
                        lineHeight: '38px',
                        color: '#1E293B',
                        display: 'block',
                    }}
                >
                    {hostingFeatures[selectedFeature]?.cardTitle}
                </Text>
                <Text
                    style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 400,
                        fontSize: '13px',
                        lineHeight: '28px',
                        color: '#6F6C8F',
                        display: 'block',
                    }}
                >
                    {hostingFeatures[selectedFeature]?.cardDescription}
                </Text>
            </div>
            <div
                className="flex items-center justify-center shrink-0"
                style={{ width: '289px', height: '120px' }}
            >
                {hostingFeatures[selectedFeature]?.cardImage ? (
                    <img
                        src={hostingFeatures[selectedFeature]?.cardImage}
                        alt={hostingFeatures[selectedFeature]?.title}
                        className="object-contain"
                        style={cardImageStyle(hostingFeatures[selectedFeature]?.title)}
                    />
                ) : (
                    hostingFeatures[selectedFeature]?.icon && (
                        <div style={{ fontSize: '80px', opacity: 0.15 }}>
                            {hostingFeatures[selectedFeature]?.icon}
                        </div>
                    )
                )}
            </div>
        </div>
    </div>
);
