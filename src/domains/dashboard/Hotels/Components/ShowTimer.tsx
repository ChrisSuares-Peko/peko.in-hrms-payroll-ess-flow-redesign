import React from 'react'

import { ClockCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import useHotelBookingTimer from '../hooks/useHotelBookingTimer';

const ShowTimer = () => {
     const isHotels=true
             const timer = useHotelBookingTimer(isHotels);
  return (
   <>
    {timer.showTimer && !timer.isExpired && (
       <Flex
           vertical
           align="center"
           className="mb-4 p-4 bg-gray-100 rounded-lg"
       >
           <ClockCircleOutlined className="text-gray-600 text-xl mb-2" />
           <Typography.Text className="text-xs text-gray-600 mb-1">
               Complete Payment in
           </Typography.Text>
           <Typography.Text className="text-2xl font-bold text-black">
               {timer.formatTime(timer.timeRemaining)}
           </Typography.Text>
       </Flex>
   )}
   </>
  )
}

export default ShowTimer