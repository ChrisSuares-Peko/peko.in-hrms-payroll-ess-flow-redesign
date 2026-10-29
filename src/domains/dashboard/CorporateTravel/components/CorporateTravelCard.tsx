import React from 'react';

import { Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import AirlineSm from '../assets/icons/airplane.png';
import BusSm from '../assets/icons/bus.png';
import TravelESimSm from '../assets/icons/eSim.webp';
import hotelsSm from '../assets/icons/hotel.png';
import VisaSm from '../assets/icons/visa.png';

type Props = {
    selectedType: string;
    handleChange: (key: string) => void;
};

const CorporateTravelCard = ({ handleChange, selectedType }: Props) => {
    const navigate = useNavigate();
    return (
        <Flex justify="center" className="w-full mt-5 mb-5" gap={8}>
            <Flex
                vertical
                className={`rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-50 ${selectedType === '1' ? 'bg-red-50/50' : 'bg-white'} py-2 px-1 gap-1 flex-1 min-w-0 shadow-[0_4px_20px_0px_rgba(0,0,0,0.08)] border border-gray-100`}
                justify="center"
                align="center"
                onClick={() => handleChange('1')}
            >
                <img src={AirlineSm} alt="Air Ticket" className="w-8 h-8 object-contain" />
                <Typography.Text
                    className={`text-[11px] text-center font-medium leading-tight ${selectedType === '1' ? 'text-brandColor' : 'text-gray-600'}`}
                >
                    Air Ticket
                </Typography.Text>
            </Flex>
            <Flex
                vertical
                className={`rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-50 ${selectedType === '2' ? 'bg-red-50/50' : 'bg-white'} py-2 px-1 gap-1 flex-1 min-w-0 shadow-[0_4px_20px_0px_rgba(0,0,0,0.08)] border border-gray-100`}
                justify="center"
                align="center"
                onClick={() => handleChange('2')}
            >
                <img src={hotelsSm} alt="Hotel Booking" className="w-8 h-8 object-contain" />
                <Typography.Text
                    className={`text-[11px] text-center font-medium leading-tight break-normal ${selectedType === '2' ? 'text-brandColor' : 'text-gray-600'}`}
                >
                    Hotel Booking
                </Typography.Text>
            </Flex>
            <Flex
                vertical
                className={`rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-50 ${selectedType === '5' ? 'bg-red-50/50' : 'bg-white'} py-2 px-1 gap-1 flex-1 min-w-0 shadow-[0_4px_20px_0px_rgba(0,0,0,0.08)] border border-gray-100`}
                justify="center"
                align="center"
                onClick={() => handleChange('5')}
            >
                <img src={BusSm} alt="Bus Ticket" className="w-8 h-8 object-contain" />
                <Typography.Text
                    className={`text-xs text-center font-medium ${selectedType === '5' ? 'text-brandColor' : 'text-gray-600'}`}
                >
                    Bus Ticket
                </Typography.Text>
            </Flex>
            <Flex
                vertical
               className={`rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-50 ${selectedType === '3' ? 'bg-red-50/50' : 'bg-white'} py-2 px-1 gap-1 flex-1 min-w-0 shadow-[0_4px_20px_0px_rgba(0,0,0,0.08)] border border-gray-100`}
                justify="center"
                align="center"
                onClick={() => handleChange('5')}
            >
                <img src={BusSm} alt="Bus Ticket" className="w-8 h-8 object-contain" />
                <Typography.Text
                    className={`text-[11px] text-center font-medium leading-tight break-normal ${selectedType === '5' ? 'text-brandColor' : 'text-gray-600'}`}
                >
                    Bus Ticket
                </Typography.Text>
            </Flex>
            <Flex
                vertical
                className={`rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-50 ${selectedType === '3' ? 'bg-red-50/50' : 'bg-white'} py-2 px-1 gap-1 flex-1 min-w-0 shadow-[0_4px_20px_0px_rgba(0,0,0,0.08)] border border-gray-100`}
                justify="center"
                align="center"
                onClick={() => navigate(paths.esim.index)}
            >
                <img src={TravelESimSm} alt="Travel eSIM" className="w-8 h-8 object-contain" />
                <Typography.Text
                    className={`text-[11px] text-center font-medium leading-tight break-normal ${selectedType === '3' ? 'text-brandColor' : 'text-gray-600'}`}
                >
                    Travel eSIM
                </Typography.Text>
            </Flex>
              <Flex
                vertical
                className={`rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-50 ${selectedType === '4' ? 'bg-red-50/50' : 'bg-white'} py-2 px-1 gap-1 flex-1 min-w-0 shadow-[0_4px_20px_0px_rgba(0,0,0,0.08)] border border-gray-100`}
                justify="center"
                align="center"
                onClick={() => handleChange('4')}
            >
                <img src={VisaSm} alt="Visa" className="w-8 h-8 object-contain" />
                <Typography.Text
                    className={`text-[11px] text-center font-medium leading-tight break-normal ${selectedType === '4' ? 'text-brandColor' : 'text-gray-600'}`}
                >
                    Visa
                </Typography.Text>
            </Flex>
          
        </Flex>
    );
};

export default CorporateTravelCard;
