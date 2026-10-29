import { Flex, Typography } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import { PlanType } from '../../plans/types';

type Props = {
    selectedType: PlanType;
    handleChange: (tab: PlanType) => void;
};

const SwitchPlan = ({ selectedType, handleChange }: Props) => {
    const { xs } = useScreenSize();

    const optionStyle = {
        fontSize: '0.75rem',
        whiteSpace: 'nowrap',
        minWidth: xs ? '120px' : '170px',
        padding: '6px 1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '999px',
        overflow: 'hidden',
    };

    const selectedStyle = {
        ...optionStyle,
        border: '2px solid #e0e0e0',
    };

    const containerStyle = {
        borderRadius: '999px',
        border: '1px solid #e0e0e0',
        padding: '4px',
        display: 'inline-flex',
        gap: '12px',
        overflow: 'hidden',
        maxWidth: '100%',
    };

    return (
        <Flex className="w-full" align="center" justify="center">
            <div style={containerStyle}>
                <Flex
                    onClick={() => handleChange(PlanType.Monthly)}
                    style={selectedType === PlanType.Monthly ? selectedStyle : optionStyle}
                    className="cursor-pointer"
                >
                    <Typography.Text className="text-[.75rem] font-medium text-center">
                        Pay Monthly
                    </Typography.Text>
                </Flex>
                <Flex
                    onClick={() => handleChange(PlanType.Annually)}
                    style={selectedType === PlanType.Annually ? selectedStyle : optionStyle}
                    className="cursor-pointer"
                >
                    <Typography.Text className="text-[.75rem] font-medium text-center">
                        Pay Annually
                    </Typography.Text>
                </Flex>
            </div>
        </Flex>
    );
};

export default SwitchPlan;
