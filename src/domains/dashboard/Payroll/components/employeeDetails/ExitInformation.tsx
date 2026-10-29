import { useState } from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import dayjs from 'dayjs';

import ExitInformationsDrawer from './forms/ExitInformationsDrawer';
import { EmployeeProfile } from '../../types/employeeprofile/type';
import { retrieveEmployeeData } from '../../utils/RetrieveEmployeeData';

type Props = {
    employeeData: EmployeeProfile;
    setRefState: (num: number) => void;
};
const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};

const ExitInformation = ({ employeeData, setRefState }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dataLeft = [
        {
            title: dayjs(
                new Date(retrieveEmployeeData(employeeData?.offBoardingInformation?.lastWorkingDay))
            ).format('DD-MM-YYYY'),
            subTitle: 'Last day of employee',
        },
        {
            title: formatText(
                retrieveEmployeeData(employeeData?.offBoardingInformation?.offBoardingType)
            ),
            subTitle: 'Type of Resignation',
        },
    ];
    const dataRight = [
        {
            title: retrieveEmployeeData(employeeData?.offBoardingInformation?.noticePeriod),
            subTitle: 'Notice Period',
        },
        {
            title: retrieveEmployeeData(employeeData?.offBoardingInformation?.reasonForOffBoarding),
            subTitle: 'Reason of Resignation',
        },
    ];

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };
    return (
        <Flex vertical>
            <Flex className="mt-12" justify="start">
                <Typography.Text className="text-textGrey">Exit Information</Typography.Text>
                <Typography.Text
                    className="text-iconRed ms-6 cursor-pointer"
                    onClick={() => toggleModal()}
                >
                    Edit
                </Typography.Text>
            </Flex>
            <Row className="w-3/5">
                <Col span={10}>
                    <Flex vertical gap={20} className="mt-6">
                        {dataLeft.map((item, index) => (
                            <Flex vertical>
                                <Flex className="w-full" vertical align="start">
                                    <Typography.Text className="text-textBlack font-medium">
                                        {item.title}
                                    </Typography.Text>
                                    <Typography.Text className="text-textGrey">
                                        {item.subTitle}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                </Col>
                <Col span={10}>
                    <Flex vertical gap={20} className="mt-6">
                        {dataRight.map((item, index) => (
                            <Flex vertical>
                                <Flex className="w-full" vertical align="start">
                                    <Typography.Text className="text-textBlack font-medium">
                                        {item.title}
                                    </Typography.Text>
                                    <Typography.Text className="text-textGrey">
                                        {item.subTitle}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                </Col>
            </Row>
            {employeeData.offBoardingInformation?.offBoardingType && (
                <ExitInformationsDrawer
                    handleCancel={toggleModal}
                    open={isModalOpen}
                    setRefState={setRefState}
                    initialValues={{
                        id: employeeData.id,
                        lastWorkingDay: employeeData.offBoardingInformation.lastWorkingDay,
                        noticePeriod: employeeData.offBoardingInformation.noticePeriod,
                        offBoardingType: employeeData.offBoardingInformation.offBoardingType,
                        reasonForOffBoarding:
                            employeeData.offBoardingInformation.reasonForOffBoarding,
                    }}
                />
            )}
        </Flex>
    );
};

export default ExitInformation;
