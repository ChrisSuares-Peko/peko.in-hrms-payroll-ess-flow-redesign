/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { Flex, Typography } from 'antd';

type PlanType = 'RC' | 'DL';

type Props = {
    selectedType: PlanType;
    handleChange: (tab: PlanType) => void;
    setIdentityNo: any;
};

const SwitchPlanWeb = ({ selectedType, handleChange, setIdentityNo }: Props) => {
    const commonStyle = {
        whiteSpace: 'nowrap' as const,
        // The labels never wrap, so a fixed 48px side padding overflowed the card on narrow
        // phones (354px of tabs in 298px of space at 330px wide). Shrink with the viewport and
        // cap at the original 48px so wider screens look exactly as before.
        padding: '6px clamp(12px, 6vw, 48px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid transparent',
    };

    const activeStyle = {
        ...commonStyle,
        background: '#fff',
        border: '1px solid #FF4F4F',
    };

    const inactiveStyle = {
        ...commonStyle,
        background: 'transparent',
    };

    const containerStyle = {
        borderRadius: '14px',
        background: '#fff',
        padding: '6px',
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '100%',
    };

    return (
        <Flex className="w-full mt-3">
            <div style={containerStyle}>
                <div
                    onClick={() => {
                        setIdentityNo('');
                        handleChange('RC');
                    }}
                    style={selectedType === 'RC' ? activeStyle : inactiveStyle}
                >
                    <Typography.Text
                        style={{
                            color: selectedType === 'RC' ? '#FF4F4F' : '#6B7280',
                            fontWeight: selectedType === 'RC' ? 500 : 400,
                            fontSize: '15px'
                        }}
                    >
                        RC Details
                    </Typography.Text>
                </div>
                <div
                    onClick={() => {
                        setIdentityNo('');
                        handleChange('DL');
                    }}
                    style={selectedType === 'DL' ? activeStyle : inactiveStyle}
                >
                    <Typography.Text
                        style={{
                            color: selectedType === 'DL' ? '#FF4F4F' : '#6B7280',
                            fontWeight: selectedType === 'DL' ? 500 : 400,
                            fontSize: '15px'
                        }}
                    >
                        DL Details
                    </Typography.Text>
                </div>
            </div>
        </Flex>
    );
};

export default SwitchPlanWeb;
