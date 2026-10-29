import { useState } from 'react';

import { Flex, Row, Button, Col, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { ReactSVG } from 'react-svg';

import CalenderSVG from '../../assets/icons/employeeInformtion/Calander.svg';
import Suitcase from '../../assets/icons/employeeInformtion/Suitcase.svg';
import LetterMail from '../../assets/icons/leaveSummary/letteremail.svg';
import { retrieveEmployeeData } from '../../utils/RetrieveEmployeeData';
import CancelOffboardingModal from '../modals/CancelOffboardingModal';
import OffBoardEmployeeModal from '../modals/OffBoardEmployeeModal';


type Props = {
    setRefresh: (num:number) => void;
    isLoading: boolean;
    employeeData: any;
};

const OffboardTab = ({
    setRefresh,
    isLoading,
    employeeData,
}: Props) => {
    const [editModal,setEditModal] = useState(false)
    const [cancelModal, setCancelModal] = useState(false);
    // Only while serving notice; after the last working day it's a rehire, not a cancellation.
    const canCancel = employeeData?.offBoardingStage === 'NOTICE_PERIOD';
 const employeeInfo = [
        {
            title: retrieveEmployeeData(
                dayjs(new Date(employeeData?.offBoardingInformation?.offBoardingDate)).format(
                    'MMM. DD, YYYY'
                )
            ),
            subTitle: 'Offboarding Date',
            icon:CalenderSVG
        },
     
        {
            title: retrieveEmployeeData(dayjs(new Date(employeeData?.offBoardingInformation?.lastWorkingDay)).format(
                    'MMM. DD, YYYY'
                )),
            subTitle: 'Last Working Day',
            icon:CalenderSVG

        },
        {
            title: retrieveEmployeeData(employeeData?.offBoardingInformation?.noticePeriod),
            icon:CalenderSVG,
            subTitle: 'Notice Period',
        },

        {
            title: retrieveEmployeeData(employeeData?.offBoardingInformation?.offBoardingType),
            subTitle: 'Offboarding Type',
            icon:Suitcase
        },
        {
            title: retrieveEmployeeData(employeeData?.offBoardingInformation?.reasonForOffBoarding),
            subTitle: 'Reason for offboarding',
            icon:Suitcase
        },
        {

            title:employeeData?.offBoardingInformation?.resignationLetter? <Button href={employeeData?.offBoardingInformation?.resignationLetter} danger type='text' className='hover:bg-[#00000000_!important]  p-0' target="_blank" download>Download Document</Button> : retrieveEmployeeData(employeeData?.offBoardingInformation?.resignationLetter),
            subTitle: 'Resignation Letter',
            icon:LetterMail
        },
    ];
    return (
        <>
           <Row className="h-full ml-10 ">
        <Col
            className=""
          
            xs={24}
            md={24}
        >
            <Flex vertical className="ml-[1rem] mr-[1rem]">
            <Flex className="mt-3" justify="space-between" align="center">
                {isLoading ? (
                    <Skeleton.Input style={{ width: 200 }} active size="small" />
                ) : (
                    <>
                        <Typography.Text className="font-medium text-textBlack text-lg">
                            Offboarding Information
                        </Typography.Text>
                        <Flex gap={10}>
                            {canCancel && (
                                <Button className="cursor-pointer" onClick={() => setCancelModal(true)}>
                                    Cancel offboarding
                                </Button>
                            )}
                            <Button
                                danger
                                className="text-iconRed  cursor-pointer"
                                style={{ marginRight: '5px' }}
                                onClick={() => setEditModal(true)}
                            >
                                Edit
                            </Button>
                        </Flex>
                    </>
                )}
            </Flex>
            <Row gutter={[25,25]} className='mt-10'>
                {employeeInfo.map((item, i) => (
                    <Col xs={24} md={12} key={i} >
                        <Flex gap={15}>
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
                        >
                            {isLoading ? (
                                <Skeleton
                                    active
                                    title={false}
                                    paragraph={{ rows: 2, width: ['100%', '50%'] }}
                                />
                            ) : (
                                <>
                                    

                                    <Typography.Text className="text-textGrey text-sm">
                                        {item.subTitle}
                                    </Typography.Text>
                                    <Typography.Text className="text-base text-textBlack">
                                        {item.title}
                                    </Typography.Text>
                                </>
                            )}
                        </Flex>

                        </Flex>
                    </Col>
                ))}
            </Row>
        </Flex>
        </Col>
        <Col xs={0} md={1} className=" -mt-4" />
       
    </Row>
    <OffBoardEmployeeModal
                        open={editModal}
                        handleCancel={() => setEditModal(false)}
                        employeeData={employeeData}
                        data={employeeData?.offBoardingInformation}
                        setOffboardReload={setRefresh as any}
                    />
    {cancelModal && (
        <CancelOffboardingModal
            employeeId={employeeData?.id}
            handleCancel={() => setCancelModal(false)}
            onCancelled={() => setRefresh(Date.now())}
        />
    )}
        </>
    );
};

export default OffboardTab;
