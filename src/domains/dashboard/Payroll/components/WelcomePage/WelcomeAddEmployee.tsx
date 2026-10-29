import React, { useState } from 'react';

import { PlusCircleOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, theme, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import EmployeeList from './EmployeeOnboard/EmployeeList';
import useOrganizationSettingsApi from '../../hooks/OrganizationSettings/useOrganizationSettingsApi';
import { setPayrollProgress } from '../../slices/payrollAuth';
import BulkUploadModal from '../modals/BulkUploadModal';

interface Props {
    setActiveTabKey: (key: any) => void;
    setRefresh: any;
}

const WelcomeAddEmployee: React.FC<Props> = ({ setActiveTabKey, setRefresh }) => {
    const dispatch = useAppDispatch();
    const screens = useScreenSize();
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const [openBulkUploadModal, setOpenBulkUploadModal] = useState(false);
    const navigate = useNavigate();
    const { updateSkipDashboard, isLoading } = useOrganizationSettingsApi();
    const handleSkipDashboard = async () => {
        await updateSkipDashboard(true);
        dispatch(setPayrollProgress({ isSkippedDasboard: true }));
        setRefresh((prev: boolean) => !prev);
    };
    return (
        <Content>
            <Row
                justify="space-between"
                className="xs:p-4 md:p-8 border rounded-2xl  border-[#EAEAEA]"
            >
                <Col>
                    <Typography.Paragraph className="lg:text-start md:text-center font-medium md:text-xl xs:text-sm">
                        Add Employees
                    </Typography.Paragraph>
                </Col>
                <Col>
                    <Row
                        gutter={[8, 8]}
                        justify="end"
                        className="lg:justify-end xs:justify-start md:justify-start"
                    >
                        <Col>
                            <Button
                                type="primary"
                                size={screens.xs ? 'small' : 'middle'}
                                danger
                                style={{
                                    backgroundColor: colorPrimary,
                                    color: 'white',
                                }}
                                onClick={() =>
                                    navigate(
                                        `${paths.dashboard.payroll}/${paths.payroll.employees}/${paths.payroll.addEmployee}`,
                                        // Lets SalaryInfo's post-create navigation know this
                                        // add-employee flow was entered from the onboarding
                                        // wizard's final step, so it returns to the Payroll
                                        // Dashboard instead of the Employees list.
                                        { state: { fromOnboarding: true } }
                                    )
                                }
                                icon={
                                    <PlusCircleOutlined className="sm:text-[8px] sm:ml-0 md:text-[12px] md:ml-1" />
                                }
                                className="md:w-34 sm:w-26 sm:text-[.6rem] xs:text-[.57rem] md:text-sm"
                            >
                                New Employee
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                size={screens.xs ? 'small' : 'middle'}
                                className="sm:w-26 md:w-34 sm:text-[.6rem] xs:text-[.57rem] md:text-sm"
                                danger
                                onClick={() => setOpenBulkUploadModal(true)}
                            >
                                Upload Employees
                            </Button>
                        </Col>
                    </Row>
                </Col>

                <Col xs={24}>
                    <EmployeeList setActiveTabKey={setActiveTabKey} />
                </Col>
            </Row>

            {openBulkUploadModal && (
                <BulkUploadModal
                    open={openBulkUploadModal}
                    handleCancel={() => setOpenBulkUploadModal(false)}
                />
            )}
            <Flex justify="space-between" align="center" gap={10} className="w-full mt-6">
                <Button onClick={() => setActiveTabKey(2)} className="px-8">
                    <Typography.Text className="text-textRed">Back</Typography.Text>
                </Button>
                <Button
                    type="primary"
                    danger
                    onClick={handleSkipDashboard}
                    className="px-8"
                    loading={isLoading}
                >
                    Take me to dashboard
                </Button>
            </Flex>
        </Content>
    );
};

export default WelcomeAddEmployee;
