import React, { useState } from 'react';

import { Badge, Button, Col, Flex, Row, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';

import { EMPLOYMENT_STAGE_TAGS } from './EmploymentStageTag';
import EmployeeInformationsDrawer from './forms/EmployeeInformationsDrawer';
import PanAndAdharSection from './PanAndAdharSection';
import { EmployeeProfile } from '../../types/employeeprofile/type';
import { formatText } from '../../utils/employeeDetails/utils';
import { retrieveEmployeeData } from '../../utils/RetrieveEmployeeData';

type Props = {
    employeeData: EmployeeProfile;
    setRefState: (num: number) => void;
    isLoading: boolean;
};
type InfoItem = {
    title: string | number;
    subTitle: string;
};

const EmployeeInformation = ({ employeeData, setRefState, isLoading }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const officialEmail = employeeData?.personalInformation?.email;

    const dataLeft = [
        {
            title: retrieveEmployeeData(employeeData?.employeeInformation?.designation),
            subTitle: 'Designation',
        },
        {
            title: retrieveEmployeeData(employeeData?.employeeInformation?.employeeId),
            subTitle: 'Employee ID',
        },

        {
            title: retrieveEmployeeData(employeeData?.employeeInformation?.workingDays),
            subTitle: 'Working Days',
        },


        {
            title: retrieveEmployeeData(employeeData?.employeeInformation?.workEmailId),
            subTitle: 'Work Email',
        },

        {
            title: retrieveEmployeeData(
                formatText(employeeData?.employeeInformation?.contractType)
            ),
            subTitle: 'Contract Type',
        },
        {
            title: retrieveEmployeeData(
                formatText(employeeData?.employeeInformation?.taxRegime)
            ),
            subTitle: 'Tax Regime',
        },
        {
            title: retrieveEmployeeData(employeeData?.employeeInformation?.reportingStaffName),
            subTitle: 'Reporting Staff',
        },
    ];

    const employmentStage = employeeData?.employmentStage;
    const probationMonths = Number(employeeData?.employeeInformation?.probationPeriod) || 0;
    const scheduledProbationEnd =
        probationMonths > 0 && employeeData?.employeeInformation?.dateOfJoin
            ? dayjs(employmentStage?.probationEndDate || dayjs(employeeData.employeeInformation.dateOfJoin).add(probationMonths, 'month'))
            : null;
    // Probation is cut short by an earlier confirmation or the last working day.
    const cutShortDates: Partial<Record<string, string | null | undefined>> = {
        CONFIRMED: employmentStage?.confirmationDate,
        NOTICE_PERIOD: employmentStage?.lastWorkingDay,
        EXITED: employmentStage?.lastWorkingDay,
    };
    const cutShortOn = employmentStage ? cutShortDates[employmentStage.stage] : null;
    const probationEnd =
        scheduledProbationEnd && cutShortOn && dayjs(cutShortOn).isBefore(scheduledProbationEnd, 'day')
            ? dayjs(cutShortOn)
            : scheduledProbationEnd;
    const stageColor = employmentStage ? EMPLOYMENT_STAGE_TAGS[employmentStage.stage]?.color : '#027A48';

    const dataRight: InfoItem[] = [
        {
            title: retrieveEmployeeData(
                employeeData?.employeeInformation?.department?.departmentName || 'N/A'
            ),
            subTitle: 'Department',
        },
        {
            title: retrieveEmployeeData(
                dayjs(new Date(employeeData?.employeeInformation?.dateOfJoin)).format('DD-MM-YYYY')
            ),
            subTitle: 'Joining Date',
        },
        {
            title: retrieveEmployeeData(employeeData?.employeeInformation?.timeSchedule),
            subTitle: 'Time Schedule',
        },

        {
            title: employmentStage ? EMPLOYMENT_STAGE_TAGS[employmentStage.stage]?.label : 'Active',
            subTitle: 'Employment Status',
        },
        {
            title: probationMonths > 0 ? `${probationMonths} ${probationMonths === 1 ? 'Month' : 'Months'}` : 'No probation',
            subTitle: 'Probation Period',
        },
        probationEnd && {
            title: probationEnd.format('DD-MM-YYYY'),
            subTitle: probationEnd.isAfter(dayjs(), 'day') ? 'Probation Ends' : 'Probation Ended',
        },
        employmentStage?.stage === 'CONFIRMED' &&
            employmentStage.confirmationDate && {
                title: dayjs(employmentStage.confirmationDate).format('DD-MM-YYYY'),
                subTitle: 'Confirmed On',
            },
    ].filter(Boolean) as InfoItem[];

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <Flex vertical className="ml-[2rem] mr-[2rem]">
            <Flex className="mt-6" justify="space-between">
                <Typography.Text className="font-medium text-lg text-textBlack">
                    Employee Information
                </Typography.Text>
                <Flex justify="end">
                    <Button
                        danger
                        className="text-iconRed cursor-pointer"
                        onClick={() => toggleModal()}
                    >
                        Edit
                    </Button>
                </Flex>
            </Flex>
            <Row className="mt-6 md:w-full ">
                <Col span={12}>
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
                <Col span={12}>
                    <Flex vertical gap={20} className="mt-6">
                        {dataRight.map((item, index) => (
                            <Flex vertical key={index}>
                                <Flex className="w-full" vertical align="start">
                                    <Skeleton active avatar loading={isLoading}>
                                        {item.subTitle === 'Employment Status' ? (
                                            <>
                                                <Badge color={stageColor} text={item.title} style={{ color: stageColor }} />
                                                <Typography.Text className="text-textGrey">
                                                    {item.subTitle}
                                                </Typography.Text>
                                            </>
                                        ) : (
                                            <>
                                                <Typography.Text className="text-textBlack font-medium">
                                                    {item.title}
                                                </Typography.Text>
                                                <Typography.Text className="text-textGrey">
                                                    {item.subTitle}
                                                </Typography.Text>
                                            </>
                                        )}
                                    </Skeleton>
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                </Col>
            </Row>
            {!!employeeData?.probationExtensions?.length && (
                <Flex vertical gap={6} className="mt-6" data-testid="probation-extensions">
                    <Typography.Text className="text-textBlack font-medium">Probation extensions</Typography.Text>
                    {employeeData.probationExtensions.map(extension => (
                        <Typography.Text key={extension.extendedAt} className="text-textGrey">
                            +{extension.months} {extension.months === 1 ? 'month' : 'months'} on{' '}
                            {dayjs(extension.extendedAt).format('DD-MM-YYYY')} (new end{' '}
                            {dayjs(extension.newEndDate).format('DD-MM-YYYY')}) — {extension.reason}
                        </Typography.Text>
                    ))}
                </Flex>
            )}
            <PanAndAdharSection
                employeeId={employeeData?.id}
                panNumber={employeeData?.panNumber}
                panVerified={employeeData?.panVerified}
                aadhaarNumber={employeeData?.aadhaarNumber}
                aadhaarVerified={employeeData?.aadhaarVerified}
                setRefState={setRefState}
            />
            <EmployeeInformationsDrawer
                handleCancel={toggleModal}
                isLoading={isLoading}
                officialEmail={officialEmail}
                open={isModalOpen}
                setRefState={setRefState}
                initialValues={{
                    id: employeeData?.id,
                    joinDate: employeeData?.employeeInformation?.dateOfJoin,
                    department: employeeData?.employeeInformation?.department?._id,
                    workingHours: employeeData?.employeeInformation?.workingHours,
                    workingDays: employeeData?.employeeInformation?.workingDays,
                    contractType: employeeData?.employeeInformation?.contractType,
                    taxRegime: employeeData?.employeeInformation?.taxRegime,
                    reportingStaff: employeeData?.employeeInformation?.reportingStaff,
                    employeeId: employeeData?.employeeInformation?.employeeId,
                    employeeStatus: employeeData?.employeeInformation?.employeeStatus,
                    designation: employeeData?.employeeInformation?.designation,
                    timeSchedule: employeeData?.employeeInformation?.timeSchedule,
                    probationPeriod: employeeData?.employeeInformation?.probationPeriod ?? 0,
                    workEmailId: employeeData?.employeeInformation?.workEmailId || "",
                }}
            />
        </Flex>
    );
};

export default EmployeeInformation;
