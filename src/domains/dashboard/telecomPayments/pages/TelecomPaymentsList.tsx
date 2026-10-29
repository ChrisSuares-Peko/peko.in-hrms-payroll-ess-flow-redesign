import { useEffect } from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import BbpsIconCard from '@domains/dashboard/billPayments/components/BbpsIconCard';
import IconCardMobile from '@domains/dashboard/billPayments/components/IconCardMobile';
import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { serviceCategoryNames } from '@utils/accessKeys';
import { checkSubServiceAccessCorporate } from '@utils/checkAccess';

import { clearPostpaid } from '../../billPayments/slices/billPaymentSlice';
import BeneficiariesList from '../components/BeneficiariesList';
import { clearPrepaid } from '../slice/prepaidFormSlice';
import { telecomPayments } from '../utils/data';

const { Text } = Typography;

const TelecomPaymentsList = () => {
    const navigate = useNavigate();
    const { xs } = useScreenSize();

    const handleClick = (item: any) => () => {
        navigate(item.url, { state: { item } });
    };
    const filteredtelecomPayments = telecomPayments.filter(item =>
        checkSubServiceAccessCorporate(serviceCategoryNames.telecom, item.title as string)
    );

    const location = useLocation();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const currentPath = location.pathname;
        return () => {
            if (currentPath === '/mobile-recharge-&-bills' || currentPath === '/dashboard') {
                dispatch(clearPrepaid());
                dispatch(clearPostpaid());
            }
        };
    }, [location.pathname, dispatch]);
    return (
        <Row>
            <Col xl={14} xxl={15} className="w-full xl:sticky xl:top-0 h-fit">
                <Flex vertical gap={40}>
                    <Text className="font-medium text-lg sm:text-xl">Mobile Recharge & Bills</Text>
                    {xs ? (
                        <Row gutter={[20, 30]}>
                            {filteredtelecomPayments.map((item: any) => (
                                <IconCardMobile
                                    icon={item.icon}
                                    title={item.title}
                                    onClick={handleClick(item)}
                                    key={item.title}
                                />
                            ))}
                        </Row>
                    ) : (
                        <Flex gap={40} wrap>
                            {filteredtelecomPayments.map((item: any) => (
                                <BbpsIconCard
                                    icon={item.icon}
                                    title={item.title}
                                    onClick={handleClick(item)}
                                    key={item.title}
                                />
                            ))}
                        </Flex>
                    )}
                </Flex>
            </Col>
            <Col
                xl={10}
                xxl={9}
                className="w-full sm:bg-gray-50 rounded-3xl sm:p-6 mt-10 sm:mt-5 xl:mt-0"
            >
                <BeneficiariesList />
            </Col>
        </Row>
    );
};

export default TelecomPaymentsList;
