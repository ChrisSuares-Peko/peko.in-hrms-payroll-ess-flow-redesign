import { DownloadOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Flex, Image, Row, Skeleton, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import SalaryPaySlip from './SalaryPaySlip';
import { SalaryProfileDetails } from './SalaryProfileDetails';
import GetEmployeeSalaryProfileDetails from '../../hooks/employeeSalaryHooks/SalaryProfileHooks/useGetEmployeeSalaryProfileApi';
import {
    setEmployeeName,
    setEmployeeEmail,
    setBasicSalary,
    setDateOfJoin,
} from '../../slices/payrollSalarySlice';
import { generateSalaryProfileData } from '../../utils/salaryProfileColumns/Data';

type Props = {};
const SalaryProfileTab = (props: Props) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { salaryId, eId } = location.state;
    const { profileData, loader } = GetEmployeeSalaryProfileDetails(salaryId);
    dispatch(setEmployeeName(profileData?.fullName || ''));
    dispatch(setEmployeeEmail(profileData?.emailId || ''));
    dispatch(setBasicSalary(profileData?.basicSalary || 0));
    dispatch(setDateOfJoin(profileData?.dateOfJoin || ''));

    const salaryProfileData = generateSalaryProfileData(profileData);
    function getInitials(name: any): string {
        const words = name.split(' ');
        const initials = words
            .map((word: any) => word.charAt(0))
            .join('')
            .substring(0, 3)
            .toUpperCase();
        return initials;
    }
    return (
        <Row className="h-full -my-4 ">
            <Col xs={24} md={6} className="h-full border-r">
                {loader ? (
                    <Skeleton />
                ) : (
                    <Flex>
                        <Flex vertical>
                            {' '}
                            <Flex className="mt-9 ml-4">
                                {profileData && profileData.profileImage ? (
                                    <div className="inline-flex overflow-hidden rounded-full w-16 h-16 border border-gray-200">
                                        <Image
                                            src={profileData.profileImage}
                                            alt="Profile Image"
                                            className="object-cover w-full h-full"
                                            preview={false}
                                        />
                                    </div>
                                ) : (
                                    <Avatar
                                        size={64}
                                        style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
                                    >
                                        {getInitials(profileData ? profileData.fullName : '')}
                                    </Avatar>
                                )}
                            </Flex>
                            <Flex vertical>
                                <Flex align="baseline" className="mt-6 ml-3">
                                    <Typography.Text className="text-fontSubHeader font-medium text-2xl">
                                        {profileData?.fullName}
                                    </Typography.Text>

                                    {!profileData?.isEmployeeDeleted && (
                                        <Typography.Text
                                            className="text-lightRed text-[0.857rem] ml-3"
                                            onClick={() => {
                                                navigate(
                                                    `/${paths.payroll.index}/${paths.payroll.employeesSalary}/${paths.payroll.employeeProfile}`,
                                                    {
                                                        state: {
                                                            employeeId: eId,
                                                        },
                                                    }
                                                );
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            View Profile
                                        </Typography.Text>
                                    )}
                                </Flex>
                                <Flex align="baseline" className="ml-3">
                                    <Typography.Text className="text-fontSubHeader font-normal mt-1 text-sm">
                                        {profileData?.designation}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Flex>
                )}
                <Flex className="mt-1 " vertical>
                    {salaryProfileData?.map((item, index) => (
                        <SalaryProfileDetails
                            key={index}
                            title={item.title}
                            icon={item.icon}
                            subtitle={item.subtitle}
                            loading={loader}
                        />
                    ))}
                </Flex>
                <Flex className="mt-3 p-0 m-0">
                    <Button
                        className="text-salaryTableButton mt-3"
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() => {
                            // Your onClick action here
                        }}
                        style={{ color: '#3DC926', display: 'none' }}
                    >
                        Download Salary Certificate
                    </Button>
                </Flex>
            </Col>

            <SalaryPaySlip profileData={profileData} loading={loader} />
        </Row>
    );
};

export default SalaryProfileTab;
