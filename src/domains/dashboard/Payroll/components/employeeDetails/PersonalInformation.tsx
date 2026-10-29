import { useState } from 'react';

import { Flex, Typography, Skeleton, Button } from 'antd';
import dayjs from 'dayjs';
import { ReactSVG } from 'react-svg';

import PersonalInformationsDrawer from './forms/PersonalInformationsDrawer';
import AddressSVG from '../../assets/icons/addressIcon.svg';
import CalenderSVG from '../../assets/icons/employeeInformtion/Calander.svg';
import GlobeSVG from '../../assets/icons/employeeInformtion/Globe.svg';
import HomeSVG from '../../assets/icons/employeeInformtion/Home.svg';
import SuitcaseSVG from '../../assets/icons/employeeInformtion/Suitcase.svg';
// import PhoneSVG from '../../assets/icons/employeeInformtion/Phone.svg';
import UserArrowSVG from '../../assets/icons/employeeInformtion/UserArrow.svg';
import UserSVG from '../../assets/icons/employeeInformtion/UserIcon.svg';
import emailSVG from '../../assets/icons/leaveSummary/letteremail.svg';
import emergencySVG from '../../assets/icons/outgoingcallIcon.svg';
import { EmployeeProfile } from '../../types/employeeprofile/type';
import { retrieveEmployeeData } from '../../utils/RetrieveEmployeeData';

type Props = {
    employeeData: EmployeeProfile;
    setRefState: (num: number) => void;
    isLoading: boolean;
};

const PersonalInformation = ({ employeeData, setRefState, isLoading }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    function formatGender(gender: string): string {
        if (!gender) return '';
        return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    }
    const employeeInfo = [
        {
            icon: CalenderSVG,
            title: retrieveEmployeeData(
                dayjs(new Date(employeeData?.personalInformation?.dateOfBirth)).format(
                    'MMM. DD, YYYY'
                )
            ),
            subTitle: 'Date of Birth',
        },
        {
            icon: UserSVG,
            title: retrieveEmployeeData(formatGender(employeeData?.personalInformation?.gender)),
            subTitle: 'Gender',
        },
        {
            icon: HomeSVG,
            title: retrieveEmployeeData(employeeData?.personalInformation?.mobileNo),
            subTitle: 'Mobile Number',
        },
        {
            icon: emailSVG,
            title: retrieveEmployeeData(employeeData?.personalInformation?.email),
            subTitle: 'Personal Email',
        },

        {
            icon: GlobeSVG,
            title: retrieveEmployeeData(employeeData?.personalInformation?.country),
            subTitle: 'Country',
        },
        {
            icon: HomeSVG,
            title: retrieveEmployeeData(employeeData?.personalInformation?.state),
            subTitle: 'State',
        },
        {
            icon: HomeSVG,
            title: retrieveEmployeeData(employeeData?.personalInformation?.pinCode),
            subTitle: 'PIN Code',
        },

        {
            icon: emergencySVG,
            title: retrieveEmployeeData(employeeData?.personalInformation?.emergencyContactNo),
            subTitle: 'Emergency Contact Number',
        },
        {
            icon: UserArrowSVG,
            title: retrieveEmployeeData(employeeData?.personalInformation?.emergencyContactName),
            subTitle: 'Emergency Contact Name',
        },
        {
            icon: UserArrowSVG,
            title: retrieveEmployeeData(
                employeeData?.personalInformation?.emergencyContactRelation
            ),
            subTitle: 'Emergency Contact Relation',
        },
        {
            icon: AddressSVG,
            title: retrieveEmployeeData(
                [
                    employeeData?.personalInformation?.addressLine1,
                    employeeData?.personalInformation?.addressLine2
                ]
                    .filter(Boolean)   // remove empty/null
                    .join(' , ')        // join with comma + space
            ),
            // title: retrieveEmployeeData(
            //     `${employeeData?.personalInformation?.addressLine1 || ''} ${
            //         employeeData?.personalInformation?.addressLine2 || ''
            //     }`.trim()
            // ),
            subTitle: 'Address',
        },
        {
            icon: SuitcaseSVG,
            title: retrieveEmployeeData(employeeData?.personalInformation?.passportNo),
            subTitle: 'Passport Number',
        },
        {
            icon: GlobeSVG,
            title: retrieveEmployeeData(employeeData?.personalInformation?.passportIssuedCountry),
            subTitle: 'Passport Issuing Country',
        },
        {
            icon: CalenderSVG,
            title: retrieveEmployeeData(
                employeeData?.personalInformation?.passportIssuedDate
                    ? dayjs(employeeData.personalInformation.passportIssuedDate).format('YYYY-MM-DD')
                    : undefined
            ),
            subTitle: 'Passport Issued Date',
        },
        {
            icon: CalenderSVG,
            title: retrieveEmployeeData(
                employeeData?.personalInformation?.passportExpiryDate
                    ? dayjs(employeeData.personalInformation.passportExpiryDate).format('YYYY-MM-DD')
                    : undefined
            ),
            subTitle: 'Passport Expiry Date',
        },
    ];

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <Flex vertical className="ml-[2rem] mr-[2rem]">
            <Flex className="mt-6" justify="space-between" align="center">
                {isLoading ? (
                    <Skeleton.Input style={{ width: 200 }} active size="small" />
                ) : (
                    <>
                        <Typography.Text className="font-medium text-textBlack text-lg">
                            Personal Information
                        </Typography.Text>
                        <Button
                            danger
                            className="text-iconRed  cursor-pointer"
                            style={{ marginRight: '5px' }}
                            onClick={() => toggleModal()}
                        >
                            Edit
                        </Button>
                    </>
                )}
            </Flex>
            <Flex className="mt-10 w-4/5" gap={25} vertical>
                {employeeInfo.map((item, i) => (
                    <Flex gap={25} justify="space-between" key={i}>
                        <Flex
                            className="bg-red-50 p-2 h-10 w-10 rounded-md"
                            justify="center"
                            align="center"
                        >
                            <ReactSVG
                                src={item.icon}
                                beforeInjection={svg => {
                                    svg.setAttribute('style', 'width: 19px; height: 19px;');
                                }}
                            />
                        </Flex>
                        <Flex
                            vertical
                            className="h-full w-full"
                            justify="space-between"
                            align="start"
                        >
                            {isLoading ? (
                                <Skeleton
                                    active
                                    title={false}
                                    paragraph={{ rows: 2, width: ['100%', '50%'] }}
                                />
                            ) : (
                                <>
                                    <Typography.Text className="text-base text-textBlack">
                                        {item.title}
                                    </Typography.Text>

                                    <Typography.Text className="text-textGrey text-sm">
                                        {item.subTitle}
                                    </Typography.Text>
                                </>
                            )}
                        </Flex>
                    </Flex>
                ))}
            </Flex>
            <PersonalInformationsDrawer
                handleCancel={toggleModal}
                open={isModalOpen}
                setRefState={setRefState}
                initialValues={{
                    id: employeeData?.id,
                    firstName: employeeData?.personalInformation?.fullName,
                    gender: employeeData?.personalInformation?.gender,
                    dateOfBirth: employeeData?.personalInformation?.dateOfBirth,
                    phoneNumber: employeeData?.personalInformation?.mobileNo,
                    personalEmail: employeeData?.personalInformation?.email,
                    email: employeeData?.personalInformation?.email,
                    emergencyContactNo: employeeData?.personalInformation?.emergencyContactNo,
                    emergencyContactName: employeeData?.personalInformation?.emergencyContactName,
                    pinCode: employeeData?.personalInformation?.pinCode,
                    addressLine1: employeeData?.personalInformation?.addressLine1,
                    addressLine2: employeeData?.personalInformation?.addressLine2,
                    emergencyContactRelation:
                        employeeData?.personalInformation?.emergencyContactRelation,
                    country: employeeData?.personalInformation?.country,
                    state: employeeData?.personalInformation?.state,
                    passportNo: employeeData?.personalInformation?.passportNo,
                    passportIssuedCountry: employeeData?.personalInformation?.passportIssuedCountry,
                    passportIssuedDate: employeeData?.personalInformation?.passportIssuedDate,
                    passportExpiryDate: employeeData?.personalInformation?.passportExpiryDate,
                }}
            />
        </Flex>
    );
};

export default PersonalInformation;
