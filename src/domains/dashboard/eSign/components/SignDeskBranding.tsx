import type { FC } from 'react';

import { Typography, Image } from 'antd';
import { Flex } from 'antd/lib';

import signdrive from '@domains/dashboard/eSign/assets/signdrive.png';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

interface SignDeskBrandingProps {
    className?: string;
    position?: 'end' | 'center' | 'start';
    isHeader?: boolean;
}

const SignDeskBranding: FC<SignDeskBrandingProps> = ({
    className,
    position = 'space-between',
    isHeader,
}) => {
    const { sm } = useScreenSize();
    const { isDisabled } = useAppSelector(state => state.reducer.eSignDoc);
    return (
        <Flex
            justify={isDisabled ? 'end' : position}
            className={`${!isHeader ? 'mt-2 md:mt-8' : ''}`}
        >
            {isHeader && !isDisabled && (
                <Flex>
                    <Typography.Text
                        className={`font-medium sm:text-xl ${!isHeader ? 'mt-2 md:mt-8' : ''}`}
                    >
                        eSign
                    </Typography.Text>
                </Flex>
            )}

            <Flex vertical>
                <Typography.Text
                    className={`text-xs ${className} ${!isHeader ? 'mt-2 md:mt-8' : ''}`}
                >
                    Partnered With
                </Typography.Text>
                <Image src={signdrive} preview={false} width={sm ? 150 : 120} />
            </Flex>
        </Flex>
    );
};

export default SignDeskBranding;
