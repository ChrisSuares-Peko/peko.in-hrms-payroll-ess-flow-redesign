import React from 'react';

import { Col, Row } from 'antd';

import { EmployeeProfile } from '../../../types/employeeprofile/type';
import EmployeeInformation from '../EmployeeInformation';
import ExitInformation from '../ExitInformation';
import OffboardTab from '../OffboardTab';
import PersonalInformation from '../PersonalInformation';

type Props = {
    employeeData: EmployeeProfile;
    setRefState: (num: number) => void;
    isLoading: boolean;
};

const BasicInformationTab = ({ employeeData, setRefState, isLoading }: Props) => (
    <Row className="h-full ml-10 ">
        <Col
            className=""
            style={{
                border: '1px solid #ddd', // Light gray border
                padding: '.625rem', // Padding inside the border
                borderRadius: '.5rem', // Optional: rounded corners
            }}
            xs={24}
            md={9}
        >
            <PersonalInformation
                isLoading={isLoading}
                setRefState={setRefState}
                employeeData={employeeData && employeeData}
            />
        </Col>
        <Col xs={0} md={1} className=" -mt-4" />
        <Col
            xs={24}
            md={11}
            style={{
                border: '1px solid #ddd',
                padding: '.625rem',
                borderRadius: '.5rem',
            }}
        >
            <>
                <EmployeeInformation
                    isLoading={isLoading}
                    setRefState={setRefState}
                    employeeData={employeeData && employeeData}
                />
                {employeeData && employeeData?.employeeInformation.employeeStatus === 'RESIGNED' ? (
                    <ExitInformation
                        setRefState={setRefState}
                        employeeData={employeeData && employeeData}
                    />
                ) : (
                    ''
                )}
            </>
        </Col>
        {employeeData?.offBoardingInformation?.offBoardingType && <Col
            xs={24}
            md={21}
            style={{
                border: '1px solid #ddd',
                padding: '.625rem',
                borderRadius: '.5rem',
            }}
            className='mt-10'
        >
            
                <OffboardTab
                employeeData={employeeData && employeeData}
                isLoading={isLoading}
                setRefresh={setRefState}
                />
            
        </Col>}
    </Row>
);

export default BasicInformationTab;
