import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useSurchargeDetails from './useSurchargeApi';
import { setPaymentData } from '../../payments/slices/payment';
import { tboBalance } from '../Api';

export default function useForm() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { hotelsRequest, hotelResponse, prebookResponse, userdetails, netAmount, customerInfo } =
        useAppSelector(state => state.reducer.hotels);
    const amountTotal = netAmount.netAmount;
    const { totalFare } = netAmount;
    const [loading, setLoading] = useState(false);
    const bookingdata = prebookResponse.HotelResult[0];
    const validationData = prebookResponse.ValidationInfo;
    const transformedArray = userdetails.map(room => {
        let leadAssigned = false; // Track if LeadPassenger is assigned in the current room
        return {
            HotelPassenger: room.passengers.map((passenger: any, passengerIndex: any) => {
                const isLeadPassenger = !leadAssigned && passengerIndex === 0; // First passenger in the room
                if (isLeadPassenger) {
                    leadAssigned = true; // Mark that LeadPassenger has been assigned
                }
                const passengerObj: any = {
                    Title: `${passenger.Title}.`,
                    FirstName: passenger.FirstName,
                    MiddleName: passenger.MiddleName || '',
                    LastName: passenger.LastName,
                    Email: passenger.Email || null,
                    PaxType: passenger.PaxType,
                    LeadPassenger: isLeadPassenger,
                    Age: passenger.Age,
                    PassportNo: passenger.PassportNo || null,
                    PassportIssueDate: passenger.PassportIssueDate || null,
                    PassportExpDate: passenger.PassportExpDate || null,
                    Phoneno: passenger.Phoneno || null,
                    PaxId: passenger.PaxId,
                    GSTCompanyAddress: passenger.GSTCompanyAddress || null,
                    GSTCompanyContactNumber: passenger.GSTCompanyContactNumber || null,
                    GSTCompanyName: passenger.GSTCompanyName || null,
                    GSTNumber: passenger.GSTNumber || null,
                    GSTCompanyEmail: passenger.GSTCompanyEmail || null,
                };

                if (passenger.PAN) {
                    passengerObj.PAN = passenger.PAN;
                }

                return passengerObj;
            }),
        };
    });

    const { surchargeData } = useSurchargeDetails();

    const handleSubmission = useCallback(async () => {
        setLoading(true);
        const balanceCheck = await tboBalance({
            userId: id,
            userType: role,
            amount: totalFare,
        });

        if (balanceCheck) {
            setLoading(false);
            const hotelAmount =
                totalFare + (surchargeData?.surcharge ? parseFloat(surchargeData.surcharge) : 0);


            const reviewTotalAdults = hotelsRequest.rooms.reduce(
                (sum: number, room: any) => sum + (room.adult || 0),
                0
            );
            const reviewTotalChildren = hotelsRequest.rooms.reduce(
                (sum: number, room: any) => sum + (room.child || 0),
                0
            );
            const reviewTotalCount = reviewTotalAdults + reviewTotalChildren;
            const reviewCheckIn = new Date(hotelsRequest.CheckIn);
            const reviewCheckOut = new Date(hotelsRequest.CheckOut);
            const reviewNightDiff = Math.ceil(
                (reviewCheckOut.getTime() - reviewCheckIn.getTime()) / (1000 * 3600 * 24)
            );
            const reviewRoomNames: string[] =
                prebookResponse.HotelResult[0]?.Rooms[0]?.Name || [];
            const reviewRoomNamePayload = reviewRoomNames.reduce(
                (acc: Record<string, string>, name: string, index: number) => {
                    acc[`room_name_${index + 1}`] = name;
                    return acc;
                },
                {}
            );
            // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
            const serviceDetails = {
                guest_count: reviewTotalCount,
                hotel_name: hotelResponse.HotelDetails[0].HotelName,
                price: totalFare,
                adults: reviewTotalAdults,
                children: reviewTotalChildren,
                city: hotelsRequest.cityName || hotelsRequest.City,
                ...reviewRoomNamePayload,
                check_in: reviewCheckIn,
                check_out: reviewCheckOut,
             
                total_price: totalFare,
                room_numbers: hotelsRequest.rooms.length,
                stay_length: reviewNightDiff,
            };
            sessionStorage.setItem(
                'service_details',
                JSON.stringify({
                    serviceDetails,
                })
            );



            const billSummary = [
                {
                    key: 'Service name',
                    value: 'Hotels',
                },
                {
                    key: 'Hotel name',
                    value: hotelResponse.HotelDetails[0].HotelName,
                },
                {
                    key: 'Amount',
                    value: formatNumberWithLocalString(totalFare),
                },
            ];

            const paymentSummary = [
                {
                    key: 'Platform fee (inclusive of GST)',
                    value: `₹ ${formatNumberWithLocalString(surchargeData?.surcharge ?? 0)}`,
                },
            ];
            const date = { checkIn: hotelsRequest.CheckIn, checkOut: hotelsRequest.CheckOut };

            const requestBody = {
                userId: id,
                userType: role,
                BookingCode: bookingdata.Rooms[0].BookingCode,
                GuestNationality: hotelsRequest.GuestNationality,
                HotelRoomsDetails: transformedArray,
                NetAmount: amountTotal,
                accessKey: accessKeys.hotels,
                currentUrl: window.location.href,
                checkInDate: date.checkIn,
                checkOutDate: date.checkOut,
                HotelImage: hotelResponse.HotelDetails[0]?.Images?.[0],
                HotelImages: hotelResponse.HotelDetails[0]?.Images,
                LastCancellationDate:
                    prebookResponse.HotelResult[0].Rooms[0]?.LastCancellationDeadline,
                CancelPolicies: prebookResponse.HotelResult[0].Rooms[0]?.CancelPolicies,
                HotelName: hotelResponse.HotelDetails[0]?.HotelName,
                TotalRooms: prebookResponse.HotelResult[0].Rooms[0].Name.length,
                checkInTime: hotelResponse.HotelDetails[0].CheckInTime,
                checkoutTime: hotelResponse.HotelDetails[0].CheckOutTime,
                IsRefundable: bookingdata.Rooms[0].IsRefundable,
                amount: totalFare,
                IsPackageFare: validationData.PackageFare,
                IsPackageDetailsMandatory: validationData.IsPackageDetailsMandatory,
                customerInfo,
            };

            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: hotelAmount,
                    title: 'Bill Summary',
                    payload: requestBody,
                    url: 'payment-gateway/wallet-payments/payment',
                    earningCashbackAmount: Number(surchargeData?.corporateCashback) || 0,
                    navigatePath: `${paths.dashboard.corporateTravel}/${paths.hotels.index}/${paths.hotels.details}/${paths.hotels.hotelView}/${paths.hotels.userDetails}/${paths.hotels.bookings}`,
                })
            );

            navigate(paths.dashboard.payments);
        } else {
            // The backend's error message is already toasted by the API interceptor.
            setLoading(false);
        }
    }, [
        id,
        role,
        totalFare,
        surchargeData?.surcharge,
        surchargeData?.corporateCashback,
        hotelResponse.HotelDetails,
        hotelsRequest.CheckIn,
        hotelsRequest.CheckOut,
        hotelsRequest.City,
        hotelsRequest.cityName,
        hotelsRequest.GuestNationality,
        hotelsRequest.rooms,
        bookingdata.Rooms,
        transformedArray,
        amountTotal,
        prebookResponse.HotelResult,
        validationData.PackageFare,
        validationData.IsPackageDetailsMandatory,
        customerInfo,
        dispatch,
        navigate,
    ]);

    return { handleSubmission, loading };
}
