import React, { useEffect } from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import BharathConnect from '@src/domains/dashboard/billPayments/assets/svg/BharatConnect.svg';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import UtilityBillsList from './UtilityBillsList';
import BeneficiariesList from '../components/BeneficiariesList';
import { clearPostpaid } from '../slices/billPaymentSlice';

const { Text } = Typography;

const BillPaymentsList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    useEffect(() => {
        const currentPath = location.pathname;
        return () => {
            if (currentPath === '/utility-payments' || currentPath === '/dashboard') {
                dispatch(clearPostpaid());
            }
        };
    }, [location.pathname, dispatch]);

    return (
        <Row className="sm:-mt-[25px]">
            <Col xs={24}>
                {/* Small screens: logo on its own row, then title + link. sm and up: one row. */}
                <Flex align="center" wrap="wrap" className="gap-x-6 gap-y-2">
                    <Text className="order-2 sm:order-1 mr-auto font-medium text-lg sm:text-xl whitespace-nowrap">
                        Utility Payments
                    </Text>
                    <Text
                        className="order-3 sm:order-2 sm:mt-3 font-medium text-sm text-bgOrange2 underline cursor-pointer whitespace-nowrap"
                        onClick={() => navigate(paths.billPayments.complaintRegistration)}
                    >
                        Orders & Complaints
                    </Text>
                    <ReactSVG
                        className="order-1 sm:order-3 w-full sm:w-auto flex items-center justify-end leading-none"
                        src={BharathConnect}
                        beforeInjection={svg => {
                            svg.setAttribute('style', 'display: block; width: 85px; height: 40px;');
                        }}
                    />
                </Flex>
            </Col>
            <Col xl={14} xxl={15} className="mt-4">
                <UtilityBillsList />
            </Col>
            <Col xl={10} xxl={9} className="w-full mt-4 sm:bg-gray-50 rounded-3xl sm:p-6">
                <BeneficiariesList />
            </Col>
        </Row>
    );
};

export default BillPaymentsList;
