import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

interface cardProps {
    data: any;
    serviceKey: string;
    isSuccessModal?:boolean
}
const fieldsConfig: any = {
    director_verify_cin: [
        { label: 'First Name', key: 'firstName' },
        { label: 'Last Name', key: 'lastName' },
        { label: 'Father’s Name', key: 'fatherFirstName' },
        { label: 'DOB', key: 'DOB' },
        { label: 'Company Name', key: 'companyName' },
        { label: 'CIN', key: 'CIN' },
        { label: 'DIN Status', key: 'DINStatus' },
    ],
    gst_return_check: [
        { label: 'Valid', key: 'valid' },
        { label: 'Method of Filing', key: 'mof' },
        { label: 'Date of Filing', key: 'dof' },
        { label: 'Return Type', key: 'rtntype' },
        { label: 'Status', key: 'status' },
    ],
    director_verify_din: [
        { label: 'First Name', key: 'firstName' },
        { label: 'Last Name', key: 'lastName' },
        { label: 'Father’s First Name', key: 'fatherFirstName' },
        { label: 'Father’s Last Name', key: 'fatherLastName' },
        { label: 'DOB', key: 'DOB' },
        { label: 'DIN Status', key: 'DINStatus' },
        { label: 'Middle Name', key: 'middleName' },
        { label: 'Father’s Middle Name', key: 'fatherMiddleName' },
    ],
    corporate_verify: [
        { label: 'Company Name', key: 'companyName' },
        { label: 'Type', key: 'type' },
        { label: 'Address Type', key: 'addressType' },
        { label: 'Address Line 1', key: 'addressLine1' },
        { label: 'Address Line 2', key: 'addressLine2' },
        { label: 'Area', key: 'area' },
        { label: 'City', key: 'city' },
        { label: 'District', key: 'district' },
        { label: 'State', key: 'state' },
        { label: 'Pincode', key: 'pincode' },
        { label: 'Country', key: 'country' },
        { label: 'Company Status', key: 'companyStatus' },
        { label: 'CIN', key: 'CIN' },
        { label: 'ROC Name', key: 'ROCName' },
        { label: 'Incorporation Date', key: 'incorporationDate' },
        { label: 'Audit Status', key: 'auditStatus' },
        { label: 'Is Audit Status Applicable', key: 'isAuditStatusApplicable' },
        { label: 'Turnover', key: 'turnover' },
        { label: 'Profit/Loss', key: 'profitLoss' },
        { label: 'Financial Year', key: 'financialYear' },
        { label: 'Financial Range', key: 'financialRange' },
        { label: 'Contact Number', key: 'contactNumber' },
        { label: 'Email Address', key: 'emailAddress' },
    ],

    // Add more services here if needed
};
const formatAsteriskSeparated = (value: any): string => {
    if (!value || value === null || /^\*+$/.test(String(value).trim())) {
        return 'N/A';
    }

    const str = String(value).trim();

    return str
        .replace(/\*+$/, '') // remove trailing *
        .split('*') // split by *
        .join(''); // join with no separator
};

const ArrayDetailsCard = ({ data, serviceKey,isSuccessModal }: cardProps) => {
    const serviceFields = fieldsConfig[serviceKey] || [];

    let newData;
    if (serviceKey === 'gst_return_check') {
        newData = data.EFiledlist;
    } else {
        newData = data?.response?.[0].response.data;
    }
    if (Array.isArray(newData) && newData.length > 0) {
        return (
            <>
                {/* <Typography.Text className="text-xs text-gray-500 px-5 mt-5">
                    {`Linked ${serviceKey.replace('_', ' ')}`}
                </Typography.Text> */}

<Row className='w-full' gutter={[15, 1]} >
                {newData.map((item, index) => (
                           <Col xs={24} md={isSuccessModal ? 24 : 12}>
                    <Flex
                        key={index}
                        vertical
                        className="w-full px-5 py-3 mt-3 border rounded-lg"
                        style={{
                            borderColor: '#e5e7eb',
                            backgroundColor: '#f9fafb',
                        }}
                        gap={10}
                    >
                        {serviceFields.map((field: any, fieldIndex: any) => (
                            <Flex
                                key={fieldIndex}
                                className="flex-col md:flex-row md:justify-between md:items-center mb-1"
                            >
                                <Typography.Text className="text-xs text-gray-500">
                                    {field.label}
                                </Typography.Text>
                                <Typography.Text className="font-medium text-xs mt-1 md:mt-0 md:text-right">
                                    {formatAsteriskSeparated(item[field.key] || '-')}
                                </Typography.Text>
                            </Flex>
                        ))}

                    </Flex>
                    </Col>
                ))}
                </Row>
            </>
        );
    }

    return null;
};

export default ArrayDetailsCard;
