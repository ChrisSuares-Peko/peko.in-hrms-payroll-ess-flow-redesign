/* eslint-disable no-nested-ternary */
import React, { useCallback, useEffect, useState } from 'react';

import { Flex, Avatar, Typography, Image, Modal, Button, Tag, Space, theme } from 'antd';
import dayjs from 'dayjs';
import { Form, Formik } from 'formik';
import { ReactSVG } from 'react-svg';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';

import EmploymentStageTag from './EmploymentStageTag';
import ProbationActions from './ProbationActions';
import CameraSVG from '../../assets/icons/employeeInformtion/camera.svg';
import NoUserSVG from '../../assets/icons/employeeInformtion/NoUser.svg';
import { useUpdateEmployeeApiNew } from '../../hooks/employeeHooks/useUpdateEmployeeApiNew';
import { profileImageSchema } from '../../schema/employeeProfile';
import { EmployeeProfile } from '../../types/employeeprofile/type';
import EssInviteModal from '../modals/EssInviteModal';

type Props = {
    data: EmployeeProfile | false | undefined;
    setRefState: (value: number) => void;
};
const EmployeeDetailsHeader = ({ data, setRefState }: Props) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isInProbation, setIsInProbation] = useState(false);
    let success;
    const { updateEmployeePersonalDetails, isLoading } = useUpdateEmployeeApiNew();
    const isProbationActive = useCallback(() => {
        if (
            !data ||
            !data.employeeInformation.dateOfJoin ||
            !data.employeeInformation.probationPeriod
        ) {
            return false;
        }

        // const probationPeriod = parseInt(data.employeeInformation.probationPeriod, 10);
        if (Number.isNaN(data.employeeInformation.probationPeriod)) {
            console.error('Probation period is not a valid number');
            return false;
        }

        const probationEndDate = dayjs(data.employeeInformation.dateOfJoin).add(
            data.employeeInformation.probationPeriod,
            'month'
        );
        return dayjs().isBefore(probationEndDate);
    }, [data]);

    useEffect(() => {
        setIsInProbation(isProbationActive());
    }, [data, isProbationActive]);
    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };
    function getInitials(name: any): string {
        const words = name.split(' ');
        const initials = words
            .map((word: any) => word.charAt(0))
            .join('')
            .substring(0, 3)
            .toUpperCase();
        return initials;
    }
    const handleCancel = () => {
        setIsModalOpen(false); // This should effectively close the modal
    };

    return (
        <Flex className="py-6 " justify="space-between" align="center">
            <Flex gap={5} justify="space-start" align="start">
                <Flex>
                    {data && data?.profileImage ? (
                        <Avatar
                            src={data.profileImage}
                            style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
                            className="w-16 h-16"
                        />
                    ) : (
                        <Avatar size={64} style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>
                            {getInitials(data ? data.personalInformation.fullName : '')}
                        </Avatar>
                    )}

                    <Flex
                        className="bg-textGreyColor rounded-full h-6 w-6 relative top-10 right-5 border-2 border-white shadow-md"
                        justify="center"
                        align="center"
                    >
                        <Avatar
                            className=""
                            size={20}
                            onClick={toggleModal}
                            style={{ cursor: 'pointer' }}
                            icon={
                                <ReactSVG
                                    src={CameraSVG}
                                    beforeInjection={svg => {
                                        svg.setAttribute('style', 'width: 13px; height: 13px;');
                                    }}
                                />
                            }
                        />
                    </Flex>
                </Flex>
                <Flex className="py-2 -ml-2" justify="space-between" align="start" vertical>
                    <Space size="middle">
                        <Typography.Text className="text-xl font-normal">
                            {data && data?.personalInformation?.fullName}
                        </Typography.Text>

                        {data && data.employmentStage ? (
                            // A confirmed employee has no header badge.
                            data.employmentStage.stage !== 'CONFIRMED' && (
                                <EmploymentStageTag employmentStage={data.employmentStage} showDetail={false} />
                            )
                        ) : data !== false && data?.offBoardingStage === 'NOTICE_PERIOD' ? (
                            <Tag
                                color="#FFF7E6"
                                style={{ color: '#D46B08', fontWeight: 'bold', borderRadius: '20px' }}
                            >
                                Notice period
                            </Tag>
                        ) : data !== false && data?.offBoardingInformation ? (
                            <Tag
                                color="rgba(80,80,80,1)"
                                style={{ color: 'white', fontWeight: 'bold', borderRadius: '20px' }}
                            >
                                {data.offBoardingInformation.offBoardingType === 'SUSPENSION'
                                    ? 'Suspended'
                                    : 'Resigned'}
                            </Tag>
                        ) : data !== false && isInProbation ? (
                            <Tag
                                color="#FFFDCC"
                                style={{
                                    color: '#775A00',
                                    borderRadius: '20px',
                                    fontWeight: 'bold',
                                }}
                            >
                                In Probation
                            </Tag>
                        ) : (
                            ''
                        )}
                    </Space>
                    <Typography.Text className="text-xs font-normal">
                        {data && data?.employeeInformation.designation}
                    </Typography.Text>
                </Flex>
            </Flex>

            {data && data?.id && !data?.offBoardingInformation && (
                <Flex gap={10}>
                    <ProbationActions employee={data} onChanged={() => setRefState(Date.now())} />
                    <Button
                        onClick={() => setIsInviteOpen(true)}
                        style={{
                            backgroundColor: colorPrimary,
                            color: 'white',
                            borderRadius: '8px',
                            fontWeight: 500,
                        }}
                    >
                        Share ESS Invite
                    </Button>
                </Flex>
            )}

            {data && data?.id && (
                <EssInviteModal
                    open={isInviteOpen}
                    onClose={() => setIsInviteOpen(false)}
                    name={data.personalInformation.fullName}
                    email={data.personalInformation.email}
                    mobileNo={data.personalInformation.mobileNo}
                    employeeId={data.id}
                    initialOfficialEmail={data.employeeInformation?.workEmailId}
                    onSuccess={() => setRefState(Date.now().valueOf())}
                />
            )}

            <Modal
                title={
                    <Flex className="w-full" gap={20} justify="center" align="center">
                        Update Profile Image
                    </Flex>
                }
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
            >
                <Flex vertical gap={20} justify="center" align="center">
                    <Formik
                        initialValues={{
                            profileImage: '',
                            format: '',
                        }}
                        onSubmit={async (values, actions) => {
                            if (data && data.id) {
                                const personalInformations = {
                                    id: data.id,
                                    employeeBasicInformation: {
                                        profileImage: {
                                            base64: values.profileImage,
                                            format: values.format,
                                        },
                                    },
                                };
                                // @ts-ignore
                                success = await updateEmployeePersonalDetails(personalInformations);
                                if (success) {
                                    handleCancel(); // Assume this closes the modal
                                    setRefState(Date.now().valueOf());
                                } else {
                                    // Keep the modal open, maybe set an error message state to display
                                    // Here you could set an error message state or similar
                                }
                                actions.setSubmitting(false);
                            }
                        }}
                        validationSchema={profileImageSchema}
                    >
                        {({ handleSubmit, values, resetForm }) => (
                            <Form className="w-full">
                                <Flex vertical gap={20} justify="center" align="center">
                                    {data !== false ? (
                                        <Image
                                            src={
                                                values.profileImage !== ''
                                                    ? `data:image/${values.format};base64,${values.profileImage}`
                                                    : data?.profileImage
                                            }
                                            preview={false}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <ReactSVG src={NoUserSVG} />
                                    )}
                                    <FileUploadInput
                                        name="profileImage"
                                        format="format"
                                        label=""
                                        showNotification
                                    />
                                </Flex>
                                <Flex className="w-full" gap={20} justify="center" align="center">
                                    <Button onClick={toggleModal}>Cancel</Button>
                                    <Button
                                        type="primary"
                                        danger
                                        onClick={() => {
                                            handleSubmit();
                                        }}
                                        loading={isLoading}
                                    >
                                        Submit
                                    </Button>
                                </Flex>
                            </Form>
                        )}
                    </Formik>
                </Flex>
            </Modal>
        </Flex>
    );
};

export default EmployeeDetailsHeader;
