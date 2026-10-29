import { useState } from 'react';

import { Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ReactSVG } from 'react-svg';

import offer from '../../Assets/icons/offer.svg';
import CancelPolicy from '../CancelPolicy';
import RateCondition from '../RateCondition';

interface room {
    name: any;
    sqft?: number;
    refund: string;
    cancellation: string;
    meal: string;
    rateNotes: any;
    cancellationPolicy?: any;
    Inclusion?: string;
    rateConditions?: any;
    RoomPromotion: any[];
}

const RoomDetails = ({
    name,
    sqft,
    refund,
    cancellation,
    meal,
    rateNotes,
    cancellationPolicy,
    Inclusion,
    rateConditions,
    RoomPromotion,
}: room) => {
 
    const [isModal, setIsModal] = useState<boolean>(false);
    const [isRateModal, setIsRateModal] = useState<boolean>(false);
   
    const rateModal = () => {
        setIsRateModal(true);
    };
    const cancelRateModal = () => {
        setIsRateModal(false);
    };
    const cancellationPolicyModal = () => {
        setIsModal(true);
    };
    const cancelModal = () => {
        setIsModal(false);
    };
  
    function formatName(roomname?: string): string {
        if (!roomname) return '';
        return roomname
            .replace(/,([^ ])/g, ', $1') // Add space after commas if missing
            .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase words
    }

    return (
        <Content className="pt-12 ">
            <Content className="rounded-[28px] border border-[#ececec] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                <Flex vertical className="py-5 px-7">
                    <Flex>
                        <Flex vertical>
                            {/* {name.map((item: any) => ( */}
                            <Typography.Text className="text-base font-medium">
                                {formatName(name)}
                            </Typography.Text>
                            {/* ))} */}
                            <Typography.Text className="pt-1 text-xs font-bold text-slate-500">
                                {meal?.replace(/_/g, ' ')}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    {RoomPromotion && (
                        <Flex gap={4} className="mt-2">
                            <Flex gap={3}>
                                <ReactSVG src={offer} />
                                <Flex gap={6} className="mt-[0.15rem]">
                                    <Typography.Text className="text-sm font-medium  text-green-600">
                                        Special Offer:
                                    </Typography.Text>
                                    <Typography.Text className="text-sm font-medium text-green-600">
                                        {RoomPromotion?.[0]?.replace(/\|\s*$/, '')}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </Flex>
                    )}

                    <Content className="mt-2 flex flex-col sm:flex-row md:gap-2 sm:gap-7">
                        <Typography.Text className="text-sm font-medium text-green-600">
                            {refund ? 'Refundable' : 'Non Refundable'}
                        </Typography.Text>
                        <Typography.Text className="text-sm font-medium text-green-600">
                            <span>•</span>  {(Inclusion ?? '').replace(/,([^ ])/g, ', $1').toLowerCase().replace(/(?:^|\s|-)\S/g, (c: string) => c.toUpperCase())}
                        </Typography.Text>
                    </Content>

                  
                    <Flex className="pt-3" gap={10} vertical>
                        <Typography.Text
                            className="text-sm font-medium underline cursor-pointer"
                            onClick={rateModal}
                        >
                            Hotel Policies
                        </Typography.Text>
                        <Typography.Text
                            className="text-sm font-medium underline cursor-pointer"
                            onClick={cancellationPolicyModal}
                        >
                            View Cancellation Policy Details
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Content>
            {/* <CheckInRoomDetails
                roomData={rateNotes}
                isModalOpen={isModalOpen}
                handleCancel={handleCancel}
            /> */}
            <CancelPolicy
                isModalOpen={isModal}
                handleCancel={cancelModal}
                cancellationPolicy={cancellationPolicy}
            />
            <RateCondition
                isModalOpen={isRateModal}
                handleCancel={cancelRateModal}
                rateCondition={rateConditions}
            />
        </Content>
    );
};

export default RoomDetails;
