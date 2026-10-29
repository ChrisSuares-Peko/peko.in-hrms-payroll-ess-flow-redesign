import React from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface QuickAccessCardProps {
    icon: string;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ icon, label, onClick, disabled }) => (
    <Flex
        vertical
        align="center"
        gap={8}
        className={`w-full sm:w-[90px] min-[1860px]:w-[120px] ${
            disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:opacity-80 transition-opacity'
        }`}
        onClick={disabled ? undefined : onClick}
        role={disabled ? undefined : 'button'}
        tabIndex={disabled ? undefined : 0}
        onKeyDown={
            disabled
                ? undefined
                : e => {
                      if (e.key === 'Enter' || e.key === ' ') onClick?.();
                  }
        }
    >
        <Flex
            align="center"
            justify="center"
            className="w-full sm:w-[90px] min-[1760px]:w-[120px] h-[80px] min-[1760px]:h-[100px] bg-[#F9F6F5] rounded-2xl"
        >
            <ReactSVG
                src={icon}
                beforeInjection={svg => {
                    svg.setAttribute('style', 'width: 50px; height: 50px;');
                }}
            />
        </Flex>
        <Typography.Text className="text-[#1F2633] text-xs font-normal leading-4 text-center w-full block">
            {label}
        </Typography.Text>
    </Flex>
);

export default React.memo(QuickAccessCard);
