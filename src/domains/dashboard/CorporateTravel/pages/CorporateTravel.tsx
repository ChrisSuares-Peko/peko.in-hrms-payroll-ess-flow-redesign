import { useEffect } from 'react';

import {Card, Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import CorporateTravelCard from '@components/molecular/corporate-travel-card/CorporateTravelCard';
import Bookingfields from '@src/domains/dashboard/Hotels/Components/HotelSearch/Bookingfields';
import BookingfieldsMobile from '@src/domains/dashboard/Hotels/Components/HotelSearch/BookingFieldsMobile';
import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { updateActiveTab } from '@src/slices/activeTabSlice';

import SearchFlight from '../../Airline/components/SearchFlight';
import SearchFlightMobile from '../../Airline/components/SearchFlightMobile';
import SearchBus from '../../BusTickets/components/landingPage/SearchBus';
import Redirect from '../../esim/components/home/Redirect';
import CorporateTravelCardSm from '../components/CorporateTravelCard';
import SearchVisa from '../components/SearchVisa';


const CorporateTravel = () => {
    const dispatch = useAppDispatch();
    const { sm, xs } = useScreenSize();
    const location = useLocation();
    const navigate = useNavigate();
    const { corporateTravelActiveTab = '1' } = useAppSelector(state => state.reducer.activeTab);
    const [searchParams] = useSearchParams();
    const isHotels = searchParams.get('isHotels') === 'true';

    useEffect(() => {
        if (isHotels) {
            dispatch(updateActiveTab({ key: 'corporateTravelActiveTab', value: '2' }));
            navigate(location.pathname, { replace: true });
        }
    }, [isHotels, dispatch, navigate, location.pathname]);

    
    useEffect(() => {
        const isHotelsCheck = searchParams.get('isHotels');

        if (isHotelsCheck === 'true') {
            dispatch(
                updateActiveTab({
                    key: 'corporateTravelActiveTab',
                    value: '2', // Hotels tab
                })
            );
        }
    }, [dispatch,searchParams]);

    const handleChange = (key: string) => {
        if (location?.state?.initialActiveTab) {
            navigate(location.pathname, { replace: true, state: null });
        }
        dispatch(updateActiveTab({ key: 'corporateTravelActiveTab', value: key }));
    };
  

    const renderContent = (key: string) => {
        switch (key) {
            case '1':
                return xs ? <SearchFlightMobile /> : <SearchFlight />;
            case '2':
                return xs ? <BookingfieldsMobile /> : <Bookingfields />;
            case '3':
                dispatch(updateActiveTab({ key: 'corporateTravelActiveTab', value: '1' }));
                return <Redirect />;
            case '4':
                return <SearchVisa />;   
            case '5':
                return <SearchBus />;
            default:
                return '';
        }
    };
    const defaultSelectedType =
        location?.state?.initialActiveTab || corporateTravelActiveTab || '1';
    return (
         <Content>
            <Flex vertical className="gap-0 sm:gap-2 mb-8">
                <Typography.Title
                    level={2}
                    className="text-center font-bold"
                    style={{
                        marginBottom: 0,
                        fontSize: 'clamp(1.2rem, 2.5vw, 1.875rem)',
                        lineHeight: 1.3,
                    }}
                >
                    The modern way to manage corporate travel - all in one place
                </Typography.Title>
            </Flex>
            <Content className="xs:hidden sm:block">
                <div className="relative flex justify-center w-full">
                    <CorporateTravelCard
                        handleChange={handleChange}
                        selectedType={defaultSelectedType}
                    />
                </div>
                <Card
                    className="md:border xs:border-none xs:p-0 md:py-9 rounded-[36px]"
                    style={{
                        boxShadow: '0px 1.94px 19.398px 0px rgba(0, 0, 0, 0.10)',
                        // borderRadius: '0 1rem 1rem 1rem',
                    }}
                    bodyStyle={sm ? {} : { padding: 8 }}
                >
                    {renderContent(defaultSelectedType)}
                </Card>
            </Content>
            <Content className="sm:hidden block relative">
                <div className="w-full px-2 mx-auto relative z-10">
                    <CorporateTravelCardSm
                        handleChange={handleChange}
                        selectedType={defaultSelectedType}
                    />
                </div>
                <Card
                    className="border-none rounded-2xl md:rounded-[36px] xs:p-0 md:py-9 mt-0"
                    style={{
                        boxShadow: '0px 1.94px 19.398px 0px rgba(0, 0, 0, 0.10)',

                        // borderRadius: '0 1rem 1rem 1rem',
                    }}
                    bodyStyle={sm ? {} : { padding: 8 }}
                >
                    {renderContent(defaultSelectedType)}
                </Card>
            </Content>
        </Content>
    );
};

export default CorporateTravel;
