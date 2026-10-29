import { useEffect } from 'react';

import { Col, Row } from 'antd';
import Lottie from 'react-lottie';
import { useLocation, useNavigate } from 'react-router-dom';

import animation from '@assets/animation/EsimLoader.json';
import { paths } from '@src/routes/paths';

import DetailsLeft from '../components/esimDetails/DetailsLeft';
import DetailsRight from '../components/esimDetails/DetailsRight';
import EsimDetailsAdditionalInfoList from '../components/esimDetails/EsimDetailAdditionalInfo';
import useGetOrderDetails from '../hooks/useGetEsimDetails';

type Props = {};

const EsimDetails = (props: Props) => {
    const locationState = useLocation().state || JSON.parse(sessionStorage.getItem('ESIM') || '{}');

    const { iccid, planId, customerUid, corporateTxnId, country, purchasedFor } = locationState;
    const navigate = useNavigate();
    useEffect(() => {
        if (!iccid || !planId) {
            sessionStorage.setItem('iccid', JSON.stringify({ iccid }));
            sessionStorage.setItem('planId', JSON.stringify({ planId }));
            sessionStorage.setItem('customerUid', JSON.stringify({ customerUid }));
            sessionStorage.setItem('corporateTxnId', JSON.stringify({ corporateTxnId }));
        } else {
            sessionStorage.setItem('iccid', iccid);
            sessionStorage.setItem('planId', planId);
            sessionStorage.setItem('customerUid', customerUid);
            sessionStorage.setItem('corporateTxnId', corporateTxnId);
        }

        // If `iccid` or `planId` is missing after attempting retrieval, navigate to a fallback page
        if (!iccid || !planId) {
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.esim.index}/${paths.esim.orders}/${paths.esim.details}`
            );
        }
    }, [iccid, planId, navigate, customerUid, corporateTxnId]);
    const { data, isLoading } = useGetOrderDetails(iccid, planId, customerUid, country);
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return (
        <Row>
            {isLoading ? (
                <Lottie options={defaultOptions} height={400} width={600} isClickToPauseDisabled />
            ) : (
                <>
                    <Col xs={24} sm={24} md={12} lg={10} xl={8} xxl={6}>
                        <DetailsLeft
                            newTopupData={data?.newTopupData}
                            countryName={data.countryName}
                            validity={data.validity}
                            corporateTxnId={corporateTxnId}
                            planName={data.planName}
                            activatedAt={data.activatedAt}
                            expiresAt={data.expiresAt}
                        />
                    </Col>
                    <Col xs={0} md={1} />
                    <Col xs={24} sm={24} md={11} lg={13} xl={15} xxl={17}>
                        <DetailsRight
                            dataBal={data.dataBal}
                            iccid={data.esim}
                            country={country || data.countryName}
                        />
                        <EsimDetailsAdditionalInfoList
                            countryName={data.countryName}
                            esim={data.esim}
                            esimState={data.esimState}
                            purchasedFor={purchasedFor}
                        />
                    </Col>
                </>
            )}
        </Row>
    );
};

export default EsimDetails;
