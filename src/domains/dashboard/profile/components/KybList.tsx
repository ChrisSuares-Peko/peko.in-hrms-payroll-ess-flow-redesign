/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Col, Divider, Flex, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { ReactSVG } from 'react-svg';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import RenderDocument from '@components/molecular/Text/RenderDocument';

import KycFileUpload from './forms/KycFileupload';
import clock from '../assets/icons/clock.svg';
import close from '../assets/icons/close.svg';
import pin from '../assets/icons/pin.svg';
import tick from '../assets/icons/tick.svg';

interface KybProps {
    title: string;
    logo: string;
    // status: string;
    shouldShowButton: boolean;
    name: string;
    data?: any;
    setDeleteDoclist: any;
}

const KybList = ({ title, logo, name, data, shouldShowButton, setDeleteDoclist }: KybProps) => {
    const [file, setFile] = useState<boolean>(false);
    const [showDelete, setShowDelete] = useState<boolean>(true);
    const [showStatus, setShowStatus] = useState(true);

    let status = data?.corporateDocuments?.[name]?.status;

    const expiryDate = data?.corporateDocuments?.[name]?.expiryDate;

    // Check if expiryDate is in the past
    if (expiryDate && dayjs(expiryDate).isBefore(dayjs())) {
        status = 'Expired';
    }
    const icon: any =
        status === 'VERIFIED'
            ? tick
            : status === 'PENDING'
              ? clock
              : status === 'UPLOADED'
                ? tick
                : status === 'Expired'
                  ? close
                  : null;
    // const status="Verified"
    const getColor = () => {
        switch (status) {
            case 'VERIFIED':
                return 'green';
            case 'PENDING':
                return 'orange';
            case 'expired':
                return 'red';
            case 'REJECTED':
                return 'red';
            case 'UPLOADED':
                return 'green';
            default:
                return 'red';
        }
    };
    const formattedStatus = (text: string) =>
        text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const existingFileUrl = data?.corporateDocuments?.[name]?.document || '';
    const tomorrow = dayjs().add(1, 'day').startOf('day');

    const date = expiryDate ? new Date(expiryDate) : null;
    const formattedDate =
        date && !Number.isNaN(date)
            ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : null;

    const handleDelete = (docName: string) => {
        setShowDelete(false);
        setShowStatus(false);
        setDeleteDoclist((prev: string[]) => [...prev, docName]);
    };

    const getName = (fileName: string) => {
        switch (fileName) {
            case 'Pan_Card':
                return 'Pan Card';
            case 'Signing_Authority_Pan_Card':
                return 'Signing Authority Pan Card';
            case 'Aadhar_Card':
                return 'Aadhaar Card';
            case 'GST_Certificate':
                return 'GST Certificate';
            case 'Bank_Proof':
                return 'Bank Letter or IBAN Certificate';
            case 'MOA_AOA':
                return 'Memorandum / Articles of Association';
            case 'Corporate_Agreement':
                return 'Corporate Agreement';
            case 'Certificate_Of_Incorporation':
                return 'Certificate of Incorporation';
            case 'Establishment_License':
                return 'Establishment Letter or License';
            default:
                return fileName.replace(/_/g, ' ');
        }
    };
    return (
        <Row className="w-full  mt-3">
            <Col xs={24} md={10} xxl={12}>
                <Flex gap={8}>
                    <ReactSVG src={logo} />
                    <Typography.Text className="md:text-sm xs:text-sm xs:mt-0 md:mt-2">
                        {title === 'Aadhar Card' ? 'Aadhaar Card' : title}
                    </Typography.Text>
                </Flex>
            </Col>
            <Col xs={24} md={4}>
                {showStatus &&
                    status &&
                    name !== 'Proof_Of_Business' &&
                    name !== 'Nature_Of_Business' && (
                        <Flex gap={6} className="xs:mt-3 md:mt-2 xs:ml-0">
                            <ReactSVG className="" src={icon} />
                            <Typography.Text className="text-sm" style={{ color: getColor() }}>
                                {formattedStatus(status)}
                            </Typography.Text>
                        </Flex>
                    )}
            </Col>

            {status === 'VERIFIED' ? (
                <Col xs={24} md={10} xxl={8}>
                    <Flex vertical className="mt-2">
                        <Flex gap={6}>
                            <ReactSVG className="mt-[2px]" src={pin} />
                            <RenderDocument
                                doc={data?.corporateDocuments?.[name]?.document}
                                label={getName(name)}
                                type="link"
                            />
                        </Flex>
                        {formattedDate ? (
                            <Typography.Text className="text-green-500 mt-2 ml-5">
                                {formattedDate}
                            </Typography.Text>
                        ) : (
                            <Typography.Text className="mt-2 ml-5">N/A</Typography.Text>
                        )}
                        {/* <ReactSVG src={verified} /> */}
                    </Flex>
                </Col>
            ) : status === 'PENDING' &&
              name !== 'Proof_Of_Business' &&
              name !== 'Nature_Of_Business' ? (
                <Col xs={24} md={10} xxl={8}>
                    <Flex vertical gap={8} className="mt-2">
                        <Flex gap={6}>
                            <ReactSVG className="mt-[2px]" src={pin} />
                            <RenderDocument
                                doc={data?.corporateDocuments?.[name]?.document}
                                label={getName(name)}
                                type="link"
                            />
                        </Flex>
                        {formattedDate && (
                            <Typography.Text className="ml-5">
                                Expire on {formattedDate}
                            </Typography.Text>
                        )}
                    </Flex>
                </Col>
            ) : status === 'UPLOADED' &&
              name !== 'Proof_Of_Business' &&
              name !== 'Nature_Of_Business' ? (
                <Col xs={24} md={10} xxl={8}>
                    {showDelete ? (
                        <Flex vertical gap={8} className="mt-2">
                            <Flex gap={6}>
                                <ReactSVG className="mt-[2px]" src={pin} />
                                <RenderDocument
                                    doc={data?.corporateDocuments?.[name]?.document}
                                    label={getName(name)}
                                    type="link"
                                />
                                <DeleteOutlined
                                    className="-mt-1"
                                    onClick={() => handleDelete(name)}
                                />
                            </Flex>
                            {formattedDate && (
                                <Typography.Text className="ml-5">
                                    Expires on {formattedDate}
                                </Typography.Text>
                            )}
                        </Flex>
                    ) : name !== 'Proof_Of_Business' && name !== 'Nature_Of_Business' ? (
                        <Row gutter={8} className="w-full xs:mt-3 md:mt-0 ">
                            <Col xs={24} md={12}>
                                <KycFileUpload
                                    name={`${name}.fileBase`}
                                    expiryFieldName={`${name}Expiry`}
                                    format={`${name}.fileFormat`}
                                    label=""
                                    showFileName
                                    showNotification
                                    setFile={setFile}
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <DatePickerInput
                                    label=""
                                    placeholder="Expiry date"
                                    isRequired
                                    name={`${name}Expiry`}
                                    // classes="xxl:w-40 xs:w-40 md:w-full xl:w-32"
                                    classes="w-full"
                                    needConfirm={false}
                                    minDate={tomorrow}
                                    isDisabled={!file}
                                />
                            </Col>
                        </Row>
                    ) : (
                        // eslint-disable-next-line react/jsx-no-useless-fragment
                        <></>
                    )}
                </Col>
            ) : (
                <Col xs={24} md={10} xxl={8}>
                    {name === 'Nature_Of_Business' ? (
                        <Row gutter={8} className="w-full xs:mt-3 md:mt-0">
                            <Col xs={24} md={12}>
                                <Typography.Text />
                            </Col>
                            <Col xs={24} md={12}>
                                <Flex vertical>
                                    <TextInput
                                        name={`${name}.fileBase`}
                                        placeholder="Enter Nature of Business"
                                        type="text"
                                        label=""
                                        readOnly={!shouldShowButton}
                                        isDisabled={!shouldShowButton}
                                        maxLength={150}
                                        allowAlphabetsAndSpecialCharacters={[
                                            ',',
                                            '.',
                                            '&',
                                            '-',
                                            '(',
                                            ')',
                                            '/',
                                            ' ',
                                        ]}
                                    />
                                   
                                </Flex>
                            </Col>
                        </Row>
                    ) : name === 'Proof_Of_Business' ? (
                        <Row gutter={8} className="w-full xs:mt-3 md:mt-0">
                            <Col xs={24} md={12}>
                                <Typography.Text />
                            </Col>
                            <Col xs={24} md={12}>
                                <Flex vertical>
                                    <TextInput
                                        name={`${name}.fileBase`}
                                        placeholder="Enter Proof of Business"
                                        type="text"
                                        label=""
                                        classes="mb-3"
                                        readOnly={!shouldShowButton}
                                        isDisabled={!shouldShowButton}
                                    />

                               
                                </Flex>
                            </Col>
                        </Row>
                    ) : (
                        <Row gutter={8} className="w-full xs:mt-3 md:mt-0">
                            <Col xs={24} md={12}>
                                <KycFileUpload
                                    name={`${name}.fileBase`}
                                    expiryFieldName={`${name}Expiry`}
                                    format={`${name}.fileFormat`}
                                    label=""
                                    showFileName
                                    showNotification
                                    setFile={setFile}
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <DatePickerInput
                                    label=""
                                    placeholder="Expiry date"
                                    isRequired
                                    name={`${name}Expiry`}
                                    classes="w-full"
                                    needConfirm={false}
                                    minDate={tomorrow}
                                    isDisabled={!file}
                                />
                            </Col>
                        </Row>
                    )}
                </Col>
            )}

            <Col span={24}>
                {status === 'PENDING' ||
                status === 'VERIFIED' ||
                (status === 'UPLOADED' &&
                    showDelete &&
                    name !== 'Proof_Of_Business' &&
                    name !== 'Nature_Of_Business') ? (
                    <Divider className="w-full mt-7" />
                ) : (
                    <Divider className="w-full" />
                )}
            </Col>
        </Row>
    );
};

export default KybList;
