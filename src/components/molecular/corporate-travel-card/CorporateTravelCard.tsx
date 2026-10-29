import {  Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import FlightIcon from './assets/icons/airplane.png';
import BusIcon from './assets/icons/bus.png';
import EsimIcon from './assets/icons/eSim.webp';
import HotelIcon from './assets/icons/hotel.png';
import VisaIcon from './assets/icons/visa.png';

import './assets/style.css';




type Props = {
    selectedType: string;
    handleChange: (key: string) => void;
};


const CorporateTravelCard = ({ selectedType, handleChange }: Props) => {
     const navigate = useNavigate();
    
      const tabs = [
        { key: '1', label: 'Air Tickets', icon: FlightIcon, onClick: () => handleChange('1') },
        { key: '2', label: 'Hotel Booking', icon: HotelIcon, onClick: () => handleChange('2') },
        { key: '5', label: 'Bus Ticket', icon: BusIcon, onClick: () => handleChange('5') },
        {
            key: '3',
            label: 'Travel eSIM',
            icon: EsimIcon,
            onClick: () => navigate(paths.esim.index),
        },
        { key: '4', label: 'Visa', icon: VisaIcon, onClick: () => handleChange('4') },
    ];

    return (
          <Flex
            className="w-[99%] sm:w-[92%] lg:w-[90%] xl:w-[90%] xxl:w-[80%] mx-auto relative z-10 drop-shadow-[0_-6px_15px_rgba(0,0,0,0.08)]"
            justify="center"
            align="stretch"
        >
            <svg
                viewBox="0 0 70 70"
                preserveAspectRatio="none"
                style={{
                    display: 'block',
                    width: 'clamp(30px, 6vw, 70px)',
                    height: '90%',
                    minHeight: '100%',
                    marginRight: '-2px',
                    position: 'relative',
                    zIndex: 20,
                    flexShrink: 0,
                }}
            >
                <path d="M 0 70 C 50 70 20 0 70 0 L 70 70 Z" fill="white" />
            </svg>

            <Flex
                className="bg-white flex-1 relative"
                justify="space-between"
                align="stretch"
                style={{
                    height: 'auto',
                }}
            >
                {tabs.map((tab, index) => {
                    const isActive = selectedType === tab.key;
                    let justifyValue: 'start' | 'center' | 'end' = 'center';

                    if (index === 0) {
                        justifyValue = 'start';
                    } else if (index === tabs.length - 1) {
                        justifyValue = 'end';
                    }

                    let transformValue = 'none';

                    if (index === 0) {
                        transformValue = 'translateX(-8px)';
                    } else if (index === tabs.length - 1) {
                        transformValue = 'translateX(8px)';
                    }

                    return (
                        <Flex
                            key={tab.key}
                            vertical
                            justify="end"
                            align="center"
                            className="flex-1 pb-6 md:pb-3 h-[85px] md:h-[90px] cursor-pointer transition-all duration-300 relative"
                            onClick={tab.onClick}
                        >
                            {/* Active Tab Background "Dome" - SVG Implementation */}
                            {isActive && (
                                <Flex
                                    justify={justifyValue}
                                    align="end"
                                    className="absolute inset-x-0 bottom-0 z-30"
                                    style={{
                                        left: index === 0 ? '-10px' : '0',
                                        right: index === tabs.length - 1 ? '-10px' : '0',
                                        width:
                                            index === 0 || index === tabs.length - 1
                                                ? 'calc(100% + 10px)'
                                                : '100%',
                                        height: '100%',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 357 70"
                                        preserveAspectRatio="none"
                                        className="block max-w-[100px] sm:max-w-[120px] md:max-w-[150px] xl:max-w-[420px] h-[72px] sm:h-[78px] md:h-[72px] xl:h-[70px]"
                                        style={{
                                            maxHeight: '100%',
                                            width: '100%',
                                        }}
                                    >
                                        <path
                                            d="M 0 70 C 30 70 30 0 60 0 L 297 0 C 327 0 327 70 357 70 Z"
                                            fill="#FFF4F4"
                                        />
                                    </svg>
                                </Flex>
                            )}

                            {/* Content Z-index to sit on top of background */}
                            <div
                                className="flex flex-col xl:flex-row items-center justify-center gap-1 xl:gap-2 relative z-40 px-1"
                                style={{
                                    transform: transformValue,
                                }}
                            >
                                <img
                                    src={tab.icon}
                                    alt={tab.label}
                                    className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] md:w-[32px] md:h-[32px] xl:w-[50px] xl:h-[50px] object-contain xl:mt-[5px]"
                                />
                                <Typography.Text
                                    className="text-[11px] sm:text-xs xl:text-sm text-center font-medium leading-tight xl:mt-3 whitespace-nowrap"
                                    style={{
                                        color: isActive ? '#FF4F4F' : '#000000',
                                    }}
                                >
                                    {tab.label}
                                </Typography.Text>
                            </div>
                        </Flex>
                    );
                })}
            </Flex>

            <svg
                viewBox="0 0 70 70"
                preserveAspectRatio="none"
                style={{
                    display: 'block',
                    width: 'clamp(30px, 6vw, 70px)',
                    height: 'auto',
                    minHeight: '100%',
                    transform: 'scaleX(-1)',
                    marginLeft: '-2px',
                    position: 'relative',
                    zIndex: 20,
                    flexShrink: 0,
                }}
            >
                <path d="M 0 70 C 50 70 20 0 70 0 L 70 70 Z" fill="white" />
            </svg>
        </Flex>
    );
};
export default CorporateTravelCard;
