import React, { useState } from 'react';

import { Button, Flex, Form, Progress, Skeleton, Spin, theme, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import KybList from '../components/KybList';
import useKybDocs from '../hooks/useAddKybDocs';
import { OneKybValidationSchema } from '../schema';
import { listData } from '../utils/data';

const Kyb = () => {
    const {
        token: { green },
    } = theme.useToken();

    const { handleAddkybDocs, data, isLoading, isDocumentUploading, setRefresh } = useKybDocs();
    const dispatch = useAppDispatch();
    const [deleteDoclist, setDeleteDoclist] = useState<any>([]);

    const verifiedDocuments = Object.values(data?.corporateDocuments || {}).filter(
        (doc: any) => doc.status === 'VERIFIED'
    )?.length;
    const increment = 20;
    const completionPercent = verifiedDocuments * increment;

    const allStatuses = Object.values(data?.corporateDocuments || {}).map((doc: any) => doc.status);
    const expiryDates = Object.values(data?.corporateDocuments || {}).map(
        (doc: any) => doc.expiryDate
    );
    const allPendingOrVerified = allStatuses.every(
        status => status === 'PENDING' || status === 'VERIFIED'
    );
    const totalDocuments = allStatuses.length;
    const hasFewerThanFiveDocuments = totalDocuments < 5;
    const hasNullStatus = allStatuses.includes(null);
    const hasExpiredDocument = expiryDates.some(
        expiryDate => expiryDate && dayjs(expiryDate).isBefore(dayjs())
    );
    const shouldShowButton =
        !allPendingOrVerified || hasNullStatus || hasFewerThanFiveDocuments || hasExpiredDocument;

    return (
        <Spin
            spinning={isDocumentUploading}
            style={{
                minHeight: '150vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Flex vertical className="w-full" align="center" gap={15}>
                {isLoading ? (
                    <Skeleton />
                ) : (
                    <>
                        <Flex>
                            <Typography.Text className="text-lg font-medium sm:text-xl">
                                One KYB -
                            </Typography.Text>
                            <Typography.Text className="font-light md:text-lg sm:ms-1">
                                For all Financial Services
                            </Typography.Text>
                        </Flex>
                        <Flex vertical className="w-full xl:px-60 xxl:px-80 xs:px-0">
                            <Typography.Text className="font-medium md:text-xs">
                                Verification status:
                            </Typography.Text>
                            <Progress percent={completionPercent} strokeColor={green} />
                        </Flex>

                        <Formik
                            validationSchema={OneKybValidationSchema}
                            initialValues={{
                                Pan_Card: data?.corporateDocuments?.Pan_Card || '',
                                Pan_CardExpiry:
                                    data?.corporateDocuments?.Pan_Card?.expiryDate || null,
                                Signing_Authority_Pan_Card:
                                    data?.corporateDocuments?.Signing_Authority_Pan_Card || '',
                                Signing_Authority_Pan_CardExpiry:
                                    data?.corporateDocuments?.Signing_Authority_Pan_Card
                                        ?.expiryDate || null,
                                Aadhar_Card: data?.corporateDocuments?.Aadhar_Card || '',
                                Aadhar_CardExpiry:
                                    data?.corporateDocuments?.Aadhar_Card?.expiryDate || null,
                                GST_Certificate: data?.corporateDocuments?.GST_Certificate || '',
                                GST_CertificateExpiry:
                                    data?.corporateDocuments?.GST_Certificate?.expiryDate || null,
                                Bank_Proof: data?.corporateDocuments?.Bank_Proof || '',
                                Bank_ProofExpiry:
                                    data?.corporateDocuments?.Bank_Proof?.expiryDate || null,
                                MOA_AOA: data?.corporateDocuments?.MOA_AOA || '',
                                MOA_AOAExpiry:
                                    data?.corporateDocuments?.MOA_AOA?.expiryDate || null,
                                Corporate_Agreement:
                                    data?.corporateDocuments?.Corporate_Agreement || '',
                                Corporate_AgreementExpiry:
                                    data?.corporateDocuments?.Corporate_Agreement?.expiryDate ||
                                    null,
                                Certificate_Of_Incorporation:
                                    data?.corporateDocuments?.Certificate_Of_Incorporation || '',
                                Certificate_Of_IncorporationExpiry:
                                    data?.corporateDocuments?.Certificate_Of_Incorporation
                                        ?.expiryDate || null,
                                Establishment_License:
                                    data?.corporateDocuments?.Establishment_License || '',
                                Establishment_LicenseExpiry:
                                    data?.corporateDocuments?.Establishment_License?.expiryDate ||
                                    null,
                                Proof_Of_Business: {
                                    fileBase:
                                        data?.corporateDocuments?.Proof_Of_Business?.document || '',
                                    fileFormat: 'string',
                                },
                                Nature_Of_Business: {
                                    fileBase:
                                        data?.corporateDocuments?.Nature_Of_Business?.document ||
                                        '',
                                    fileFormat: 'string',
                                },
                            }}
                            onSubmit={async (values: any) => {
                                const proofOfBusiness =
                                    values.Proof_Of_Business?.fileBase || values.Proof_Of_Business;

                                const urlRegex =
                                    /^(https?:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

                                if (
                                    proofOfBusiness &&
                                    proofOfBusiness?.fileBase !== '' &&
                                    !urlRegex.test(proofOfBusiness)
                                ) {
                                    dispatch(
                                        showToast({
                                            description: 'Proof of business must be a valid URL.',
                                            variant: 'error',
                                        })
                                    );
                                    return;
                                }
                                const formattedData = {
                                    documents: Object.entries(values)
                                        .filter(
                                            ([_, doc]: [string, any]) =>
                                                // ✅ only include if doc is a non-null object with fileBase and fileFormat
                                                doc &&
                                                typeof doc === 'object' &&
                                                'fileBase' in doc &&
                                                'fileFormat' in doc &&
                                                doc.fileBase !== ''
                                        )
                                        .map(([documentName, doc]: [string, any]) => ({
                                            documentName,
                                            fileBase: doc.fileBase,
                                            fileFormat: doc.fileFormat,
                                            expiryDate: values[`${documentName}Expiry`] || null,
                                        })),
                                    deleteDoclist,
                                };

                                if (!formattedData.documents.length && !deleteDoclist.length) {
                                    dispatch(
                                        showToast({
                                            description:
                                                'No changes made. Please update at least one field to continue.',
                                            variant: 'warning',
                                        })
                                    );
                                    return;
                                }

                                const res: boolean = await handleAddkybDocs(formattedData);
                                if (res === true) {
                                    setTimeout(() => {
                                        setRefresh(true);
                                        dispatch(
                                            showToast({
                                                description:
                                                    'Your details have been saved successfully',
                                                variant: 'success',
                                            })
                                        );
                                        setDeleteDoclist([]);
                                    }, 5000);
                                }
                            }}
                        >
                            {({ handleSubmit }) => (
                                <Form
                                    onFinish={handleSubmit}
                                    className="w-full xl:px-32 xxl:36 xs:px-0"
                                >
                                    <Content className="w-full mt-7">
                                        {listData.map((item, index) => (
                                            <KybList
                                                key={item.name}
                                                title={item.title}
                                                logo={item.logo}
                                                name={item.name}
                                                setDeleteDoclist={setDeleteDoclist}
                                                data={data}
                                                shouldShowButton={shouldShowButton}
                                            />
                                        ))}
                                    </Content>

                                    <Flex justify="space-between">
                                        <Flex>
                                            <Typography.Text
                                                type="secondary"
                                                style={{ marginLeft: '10px' }}
                                                className="xs:text-xs md:text-sm"
                                            >
                                                (File Formats Supported: JPG, JPEG, PNG, PDF, DOC,
                                                DOCX, XLS & XLSX. Max. size: 5 MB)
                                            </Typography.Text>
                                        </Flex>
                                        {/* <Typography.Text>Expiry Date: 20-07-2024</Typography.Text> */}
                                    </Flex>
                                    <Flex className="w-full mt-5 ml-4">
                                        {shouldShowButton && (
                                            <Button
                                                type="primary"
                                                danger
                                                className="bg-bgOrange2 h-9"
                                                size="small"
                                                htmlType="submit"
                                                // loading={isDocumentUploading}
                                                // disabled={isDocumentUploading}
                                            >
                                                Update Changes
                                            </Button>
                                        )}
                                    </Flex>
                                </Form>
                            )}
                        </Formik>
                    </>
                )}
            </Flex>
        </Spin>
    );
};

export default Kyb;
