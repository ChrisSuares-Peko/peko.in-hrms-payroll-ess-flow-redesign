import { useState } from 'react';

import { Col, Flex, Row, Skeleton, Typography } from 'antd';

import { retrieveAssetData } from '../../utils/assetDetails';
import { formatDate } from '../../utils/helperFunctions';
import UserInformationModal from '../Modals/UserInformationModal';

type Props = {
    setRefState: (num: number) => void;
    isLoading: boolean;
    data: any;
};
// function capitalizeFirstLetter(string: any) {
//     if (!string) return ''; // Return an empty string if input is falsy
//     return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
// }

const UserInformation = ({ setRefState, isLoading, data }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    function daysSince(dateStr: string): number {
        const pastDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = +today - +pastDate;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days < 0 ? 0 : days;
    }

    const dataLeft = [
        {
            title: retrieveAssetData(data?.data?.cloud_employee?.employeeName),
            subTitle: 'Used by',
        },
        {
            title: retrieveAssetData(data?.data?.cloud_employee?.employeeID),
            subTitle: 'Employee ID',
        },
        {
            title: data?.data?.assignDate ? `${daysSince(data.data.assignDate)} days` : '0 days',
            subTitle: 'Used',
        },
    ];

    const dataRight = [
        {
            title: retrieveAssetData(data?.data?.cloud_employee?.department),
            subTitle: 'Department',
        },
        {
            title: retrieveAssetData(formatDate(data?.data?.cloud_employee?.joiningDate)),
            subTitle: 'Joining Date',
        },
        // {
        //     title: retrieveAssetData(data?.data?.cloud_employee?.employeeName),
        //     subTitle: 'Using for',
        // },
    ];

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <Flex vertical>
            <Flex className="mt-6" justify="start">
                <Typography.Text className="text-textGrey">User Information</Typography.Text>
                {/* <Typography.Text
                    className="text-iconRed ms-6 cursor-pointer"
                    onClick={() => toggleModal()}
                >
                    Edit User
                </Typography.Text> */}
            </Flex>
            <Row className="mt-3 w-3/5">
                <Col span={10}>
                    <Flex vertical gap={20} className="mt-6">
                        {dataLeft.map((item, index) => (
                            <Flex vertical>
                                {isLoading ? (
                                    <Skeleton active avatar />
                                ) : (
                                    <Flex className="w-full" vertical align="start">
                                        <Skeleton active avatar loading={isLoading}>
                                            <Typography.Text className="text-textBlack font-medium">
                                                {item.title}
                                            </Typography.Text>
                                            <Typography.Text className="text-textGrey">
                                                {item.subTitle}
                                            </Typography.Text>
                                        </Skeleton>
                                    </Flex>
                                )}
                            </Flex>
                        ))}
                    </Flex>
                </Col>
                <Col span={10}>
                    <Flex vertical gap={20} className="mt-6">
                        {dataRight.map((item, index) => (
                            <Flex vertical>
                                <Flex className="w-full" vertical align="start">
                                    <Skeleton active avatar loading={isLoading}>
                                        <Typography.Text className="text-textBlack font-medium">
                                            {item.title}
                                        </Typography.Text>
                                        <Typography.Text className="text-textGrey">
                                            {item.subTitle}
                                        </Typography.Text>
                                    </Skeleton>
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                </Col>
            </Row>
            <UserInformationModal
                handleCancel={toggleModal}
                isLoading={isLoading}
                open={isModalOpen}
                setRefState={setRefState}
                initialValues={null}
            />
        </Flex>
    );
};

export default UserInformation;
