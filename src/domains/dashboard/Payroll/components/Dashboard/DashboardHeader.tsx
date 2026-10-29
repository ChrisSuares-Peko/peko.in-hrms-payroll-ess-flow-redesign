import React, { useEffect, useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { usePaymentLinkOnboarding } from '@domains/dashboard/paymentLinks/hooks/usePaymentLinkOnboarding';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

// import settingsicon from '../../../../../assets/images/settingsicon';
import addIcon from '../../assets/images/addIcon.svg';
import settingsicon from '../../assets/images/settingsIcon.svg';
import { useValidateEmployeeSubscriptionLimit } from '../../hooks/employeeHooks/useValidateEmployeeSubscriptionLimit';
import { resetEmployeeState } from '../../slices/employeeSettings';
import LeaveModal from '../Leaves/LeaveModal';
import AddEmployeeModal from '../modals/AddEmployeeModal';

interface DashboardHeaderProps {
    processSalary?: React.MutableRefObject<null>;
    addLeave?: React.MutableRefObject<null>;
    addEmployee?: React.MutableRefObject<null>;
    hrSettings?: React.MutableRefObject<null>;
}
const DashboardHeader = ({
    addLeave,
    hrSettings,
    processSalary,
    addEmployee,
}: DashboardHeaderProps) => {
    // const {
    //     token: {},
    // } = theme.useToken();
    // const navigate = useNavigate();
    const [openLeaveApplicationModal, setOpenLeaveApplicationModal] = useState(false);
    const [openAddEmployeeModal, setOpenAddEmployeeModal] = useState(false);
    const dispatch = useAppDispatch();

    const { fetchStatus } = usePaymentLinkOnboarding();

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // const isOnboarded = record?.status === 'active';

    // const handleProcessSalary = () => {
    //     if (isOnboarded) {
    //         navigate(`/${paths.payroll.index}/${paths.payroll.salaryDashboard}`);
    //     } else {
    //         navigate(`/${paths.payroll.index}/${paths.payroll.payrollAccountSetup}`);
    //     }
    // };
    const { validateLimit, isLoading: isValidating } = useValidateEmployeeSubscriptionLimit();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const handleNewEmployeeClick = async () => {
        if (isValidating) {
            return;
        }
        const response = await validateLimit({
            userId: id,
            userType: role,
        });

        if (!response) return;
        dispatch(resetEmployeeState());
        setOpenAddEmployeeModal(true);
    };

    const actionButtonClass =
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-normal';

    return (
        <Col span={24} className="">
            <Row className="pb-8 pe-2" align="middle" justify="space-between" gutter={[20, 12]}>
                <Flex gap="middle" vertical>
                    <Typography.Text className="text-xl font-medium ms-3">
                        HR Dashboard
                    </Typography.Text>
                </Flex>
                <Flex justify="end" align="center" gap={14} className="xs:w-full md:w-auto">
                    {/* Salary dashboard button temporarily hidden — salary rollout/payout
                    isn't live yet. Re-enabling this needs moneyAdd re-imported (assets/
                    images/money-add.png) and useNavigate re-imported from react-router-dom.
                    <Button
                        icon={
                            <img
                                src={moneyAdd}
                                alt="settings"
                                style={{ width: 16, height: 16, color: 'white' }}
                            />
                        }
                        ref={processSalary}
                        className={actionButtonClass}
                        type="primary"
                        danger
                        onClick={handleProcessSalary}
                    >
                        {isOnboarded ? 'Salary dashboard' : 'Set up your salary rollout'}
                    </Button>
                    */}
                    <Button
                        icon={
                            <img src={addIcon} alt="settings" style={{ width: 14, height: 14 }} />
                        }
                        ref={addEmployee}
                        className={`${actionButtonClass} flex-1 sm:flex-none`}
                        danger
                        onClick={handleNewEmployeeClick}
                    >
                        Add Employee
                    </Button>
                    {/* <Button
                        ref={addLeave}
                        className="hidden sm:block"
                        danger
                        onClick={() =>
                            navigate(`/${paths.payroll.index}/${paths.payroll.employeeLeave}`)
                        }
                    >
                        Add Leave
                    </Button> */}

                    <Link
                        ref={hrSettings}
                        className="flex-1 sm:flex-none md:mx-0"
                        to={`/${paths.payroll.index}/${paths.payroll.payrollSettings}?activeTab=1`}
                    >
                        <Button
                            className={`${actionButtonClass} w-full sm:w-auto text-red`}
                            danger
                            icon={
                                <img
                                    src={settingsicon}
                                    alt="settings"
                                    style={{ width: 16, height: 16 }}
                                />
                            }
                        >
                            Settings
                        </Button>
                    </Link>
                </Flex>
            </Row>
            {/* <Divider className='mt-6' /> */}

            {openLeaveApplicationModal && (
                <LeaveModal
                    open={openLeaveApplicationModal}
                    handleCancel={() => setOpenLeaveApplicationModal(false)}
                />
            )}

            {openAddEmployeeModal && (
                <AddEmployeeModal
                    open={openAddEmployeeModal}
                    onClose={() => setOpenAddEmployeeModal(false)}
                />
            )}
        </Col>
    );
};
export default DashboardHeader;
