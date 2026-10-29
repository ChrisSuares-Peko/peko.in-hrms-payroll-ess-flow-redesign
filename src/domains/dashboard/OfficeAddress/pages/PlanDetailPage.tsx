import { useState, useEffect } from 'react';

import { Row, Col, Typography, Grid, Skeleton } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import FormInput from '../components/FormInput';
import Location from '../components/Location';
import LocationCard from '../components/LocationCard';
import PlanCard from '../components/PlanCard';
import PlanCardMobile from '../components/PlanCardMobile';
import usePlansApi from '../hooks/usePlansApi';
import useWorkspacesApi from '../hooks/useWorkspaces';
import { setPlanData } from '../slices';
import { PlanDetail } from '../types/index';

const { useBreakpoint } = Grid;

const PlanDetailPage = () => {
    const dispatch = useAppDispatch();
    const screens = useBreakpoint();
    const { state } = useLocation();
    const [plan, setPlan] = useState<PlanDetail>();
    const { getPlanById, isLoading } = usePlansApi({ initialLoading: false });
    const { workspaces, isLoading: isWorkspacesLoading } = useWorkspacesApi(state);
    const navigate = useNavigate();
    const [buttonState, setButtonState] = useState<number>(0);

    useEffect(() => {
        if (state && state > 0) {
            getPlanById(state).then(data => {
                dispatch(
                    setPlanData({
                        planId: data?.id!,
                        planName: data?.name!,
                        amount: data?.price!,
                        workspaceId: null,
                    })
                );
                setPlan(data);
            });
        } else {
            navigate(paths.dashboard.officeAddress);
        }
    }, [state, getPlanById, dispatch, navigate]);

    return (
        <Skeleton active loading={isLoading || isWorkspacesLoading}>
            <Row gutter={[40, 20]} className="mt-5 sm:mt-0">
                {workspaces && workspaces.length > 0 ? (
                    <>
                        <Col xs={24} xl={9}>
                            {screens.xs ? (
                                <PlanCardMobile plan={plan!} hideBtn />
                            ) : (
                                <PlanCard plan={plan!} />
                            )}
                        </Col>
                        <Col xs={24} xl={15}>
                            <Typography.Paragraph className="font-bold text-sm sm:text-lg">
                                Choose your Location
                            </Typography.Paragraph>
                            <Row
                                gutter={[0, 30]}
                                className="mt-5 sm:mt-7 max-h-[30rem] sm:max-h-80 overflow-y-scroll"
                            >
                                {workspaces?.map(item => (
                                    <Col key={item.id} span={24}>
                                        {screens.xs ? (
                                            <Location data={item} />
                                        ) : (
                                            <LocationCard buttonState={buttonState} data={item} />
                                        )}
                                    </Col>
                                ))}
                            </Row>
                            <Content className="mt-5 w-full md:w-1/2 xl:w-full">
                                <FormInput
                                    buttonState={buttonState}
                                    setButtonState={setButtonState}
                                    locationRequired
                                />
                            </Content>
                        </Col>
                    </>
                ) : (
                    <>
                        <Col xs={24} md={10} lg={12} xl={8}>
                            {screens.xs ? (
                                <PlanCardMobile plan={plan!} hideBtn />
                            ) : (
                                <PlanCard plan={plan!} />
                            )}
                        </Col>

                        <Col xs={24} md={14} lg={12} xl={16}>
                            <FormInput />
                        </Col>
                    </>
                )}
            </Row>
        </Skeleton>
    );
};

export default PlanDetailPage;
