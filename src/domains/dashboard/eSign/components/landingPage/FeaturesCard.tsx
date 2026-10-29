import React from 'react';

import { Flex, Grid, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

interface IconCardProps {
    icon: string;
    title: string;
    path?: any;
    eSignLeft: number;
    accessLimit: boolean;
}

const FeaturesCard = ({ icon, title, path, eSignLeft, accessLimit }: IconCardProps) => {
    const screens = Grid.useBreakpoint();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleNavigate = () => {
        if (accessLimit && eSignLeft < 1) {
            dispatch(
                showToast({
                    description: 'You have reached your eSign limit. Please upgrade to continue.',
                    variant: 'warning',
                })
            );
        } else {
            navigate(path);
        }
    };
    return (
        <Flex
            vertical
            align="center"
            onClick={handleNavigate}
            className="w-full mt-2 transition duration-300 transform cursor-pointer bg-bgIconCard rounded-2xl sm:rounded-3xl hover:scale-105"
        >
            <Flex vertical align="center" className="">
                <Flex
                    // className={`w-[9.2rem] h-32 sm:w-[13rem] sm:h-40 md:w-[11rem] md:h-36 lg:w-[10rem] lg:h-36 xl:w-[20.5rem] xl:h-60  bg-bgIconCard rounded-2xl sm:rounded-3xl `}
                    className="h-24 sm:h-32 md:h-40 md:w-40 lg:w-[10rem] xl:h-52 w-full"
                    align="center"
                    justify="center"
                    vertical
                >
                    <ReactSVG
                        className="more-services"
                        beforeInjection={svg => {
                            if (screens.xs) {
                                svg.setAttribute('style', 'width: 40px; height: 40px;');
                            } else if (screens.xl) {
                                svg.setAttribute('style', 'width: 60px; height: 60px;');
                            } else if (screens.md) {
                                svg.setAttribute('style', 'width: 50px; height: 50px;');
                            }
                        }}
                        src={icon}
                    />
                    <Typography.Text className="text-[.75rem] text-center sm:text-[.975rem] md:text-[1.175rem]  line-clamp-2 pt-1 sm:pt-5">
                        {title}
                    </Typography.Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default FeaturesCard;
