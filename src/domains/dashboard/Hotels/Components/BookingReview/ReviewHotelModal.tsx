import React from 'react'

import { Button, Divider, Flex, Modal, Typography } from 'antd'
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import { ReactSVG } from 'react-svg';

import CheckoutTextRow from '@src/domains/dashboard/GiftCards/components/CheckoutTextRow';
import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import calendar from '../../Assets/calendar.svg'
import guest from '../../Assets/guest.svg'
import home from '../../Assets/home.svg'
import location from '../../Assets/icons/locationIcon.svg'


interface modalProps {
    isModalOpen: boolean;
    handleCancel: () => void;
    prebookResponse: any
    handleSubmission: () => void;
    loading: boolean;
}

const ReviewHotelModal = ({ isModalOpen, handleCancel, prebookResponse, handleSubmission, loading }: modalProps) => {

    const { hotelResponse, hotelsRequest, netAmount } = useAppSelector(state => state.reducer.hotels);
    const response = hotelResponse as any;
 
    const checkIn = new Date(hotelsRequest.CheckIn);
    const checkout = new Date(hotelsRequest.CheckOut);

    const timeDiff = checkout.getTime() - checkIn.getTime();
    const nightDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const totalAdults = hotelsRequest.rooms.reduce((sum: any, r: any) => sum + r.adult, 0);
    const totalChildren = hotelsRequest.rooms.reduce((sum: any, r: any) => sum + r.child, 0);
    let guestText = `${totalAdults} Adult${totalAdults > 1 ? 's' : ''}`;

    if (totalChildren > 0) {
        guestText += `, ${totalChildren} Child${totalChildren > 1 ? 'ren' : ''}`;
    }


    const rateConditions = prebookResponse.HotelResult[0].RateConditions

    const renderPolicy = (policy: any, index: any) => {
        // Replace all INR with ₹
        const policyWithRupee = policy.replace(/\bINR\b/g, '₹');

        const isHtml =
            policyWithRupee.includes('&lt;') ||
            policyWithRupee.includes('<ul>') ||
            policyWithRupee.includes('<li>');

        const decodedHTML = policyWithRupee
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');

        return (
            <Flex key={index} vertical>
                <Typography.Text className="pt-1 text-sm" style={{ lineHeight: '1.5' }}>
                    {/* eslint-disable-next-line react/no-danger */}
                    {isHtml ? <span dangerouslySetInnerHTML={{ __html: decodedHTML }} /> : policyWithRupee}
                </Typography.Text>
            </Flex>
        );
    };


    const firstRoom = prebookResponse?.HotelResult?.[0]?.Rooms?.[0];
    const firstPolicy = firstRoom?.CancelPolicies?.[0];
    const dateOnly = firstPolicy.FromDate.split(' ')[0];


    return (
        <Modal
            title="Confirm Your Booking"
            open={isModalOpen}
            onCancel={handleCancel}
            width={600}
            footer={[
                <Flex vertical>
                    <Flex className='mt-5' gap={10}>
                        <Button
                            danger
                            type="default"
                            className="w-full font-medium px-5 h-10"
                            onClick={handleCancel}
                        >
                            Go Back
                        </Button>
                        <Button
                            danger
                            type="primary"
                            className="w-full font-medium px-5 h-10"
                            onClick={handleSubmission}
                            loading={loading}
                        >
                            Continue
                        </Button>
                    </Flex>
                </Flex>
            ]}
            bodyStyle={{
                maxHeight: '65vh',
                overflowY: 'auto',
            }}
            styles={{
                content: {
                    borderRadius: 16,
                },
            }}
        >

            <Divider />
            <Content className="px-2">
                <Typography.Text className="mt-5 text-xl font-medium text-valueText ">
                    {response.HotelDetails[0].HotelName}
                </Typography.Text>
                <Flex className='mt-3' gap={4}>
                    <ReactSVG src={location} beforeInjection={svg => {
                        svg.setAttribute(
                            'style',

                            'width: 17px; height: 17px;'
                        );
                    }} />
                    <Typography.Text className="text-sm text-textGrey xxl:text-sm">
                        {response.HotelDetails[0].Address}
                    </Typography.Text>
                </Flex>
                <Divider className='mt-3' />
                <Flex vertical>

                    <Typography.Text className=" text-lg font-medium text-valueText ">Booking Details</Typography.Text>
                    <Flex gap={6} className='mt-3'>
                        <ReactSVG src={home} />
                        {prebookResponse.HotelResult[0]?.Rooms[0]?.Name.map((item: string) => (
                            <Typography.Text className="text-sm font-normal xxl:text-sm " style={{ marginTop: "3px" }}>
                                {item}
                            </Typography.Text>
                        ))}
                    </Flex>
                    <Flex gap={9} className='mt-3'>
                        <ReactSVG src={calendar}
                            beforeInjection={svg => {
                                svg.setAttribute(
                                    'style',

                                    'width: 16px; height: 16px;  margin-top:1px'
                                );
                            }} />
                        <Flex vertical>
                            <Typography.Text className="text-sm font-normal  xxl:text-sm " style={{ marginTop: "1px" }}>
                                Check-in & Check-out
                            </Typography.Text>
                            <>
                                <Typography.Text className="mt-2 text-xs font-normal text-textGrey xxl:text-sm">
                                    {dayjs(checkIn).format('MMMM D, YYYY')} - {dayjs(checkout).format('MMMM D, YYYY')}
                                </Typography.Text>
                                <Typography.Text className="mt-1 block text-xs text-textGrey " data-testid="staylength">
                                    {nightDifference} {nightDifference === 1 ? 'Night' : 'Nights'}
                                </Typography.Text>
                            </>
                        </Flex>
                    </Flex>

                    <Flex gap={9} className='mt-3'>
                        <ReactSVG src={guest} beforeInjection={svg => {
                            svg.setAttribute(
                                'style',

                                'width: 16px; height: 16px;'
                            );
                        }} />
                        <Flex vertical >

                            <Typography.Text className="text-sm font-normal  xxl:text-sm">
                                Guests
                            </Typography.Text>
                            <Typography.Text className='mt-2 text-textGrey text-xs ' >
                                {guestText}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                </Flex>
                <Divider />
                <Flex vertical>
                    <Typography.Text className='mt-2 font-medium'>Price breakdown</Typography.Text>
                    <Flex className='mt-2'>

                        <CheckoutTextRow
                            text={`Subtotal (${nightDifference} ${nightDifference === 1 ? 'night' : 'nights'})`}
                            value={formatNumberWithLocalString(netAmount.totalFare)}
                        />
                    </Flex>
                    <Divider />
                    <Flex className=''>
                        {/* <CheckoutTextRow
                            text="Total"
                            value={formatNumberWithLocalString(netAmount.totalFare)}
                            bold
                        /> */}
                        <Flex className=" w-full" justify="space-between" align="center">
                            <Typography.Text
                                className='text-zinc-900 text-base'

                            >
                                Total
                            </Typography.Text>
                            <Typography.Text
                                className='text-zinc-900 text-lg font-medium'
                            >
                                ₹ {formatNumberWithLocalString(netAmount.totalFare)}
                            </Typography.Text>
                        </Flex>

                    </Flex>

                </Flex>
                <Divider className='mt-1' />
                <Flex vertical>
                    <Typography.Text className='mt-2 font-medium'>Booking Rules & Policies</Typography.Text>

                    <Flex
                        className="mt-3 mb-2 p-4 rounded-lg"
                        vertical
                        style={{
                            backgroundColor: '#F0FFF4',
                            border: '1px solid #86EFAC',
                        }}
                    >
                        <Typography.Text
                            className="font-medium"
                            style={{
                                color: '#166534',
                                fontSize: 15,
                            }}
                        >
                            Free Cancellation
                        </Typography.Text>

                        <Typography.Text
                            className="mt-1"
                            style={{
                                color: '#166534',
                                fontSize: 13,
                                lineHeight: '20px',
                            }}
                        >
                            Cancel for free until 11:59 PM on{' '}
                            <strong>
                                {dateOnly}
                            </strong>{' '}
                            (D-1). After that, cancellation will incur charges.
                        </Typography.Text>
                    </Flex>



                    {rateConditions && rateConditions.length > 0 ? (
                        <Flex className='mb-2' vertical gap={15}>
                            {rateConditions.map((policy: any, index: any) =>
                                renderPolicy(policy, index)
                            )}
                        </Flex>
                    ) : (
                        <Typography className="mt-3 text-justify" style={{ lineHeight: '1.5' }}>
                            Hotel policy details are not available at this time.
                        </Typography>
                    )}

                </Flex>



            </Content>
        </Modal>
    )
}

export default ReviewHotelModal