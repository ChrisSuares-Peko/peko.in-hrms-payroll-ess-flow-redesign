import React from 'react';

import { Button, Drawer, Flex, Form } from 'antd';
import { Typography } from 'antd/lib';
import { Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import { formattedDateOnly } from '@utils/dateFormat';

import DocumentInfo from './DocuementInfo';
import InfoRow from './InfoRow';
import useUpdateKybStatus from '../../hooks/collectorKyb/useUpdateKybStatus';
import { collectorKybSchema } from '../../schema/collectorKybSchema';
import { Records } from '../../types/collectorKyb';
import { getKybStatusDropdown } from '../../utils/collectorKyb';

interface modalProps {
    open: boolean;
    handleCancel: () => void;
    data?: Records;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}
const CollectorKybModal = ({ open, handleCancel, data, setRefresh }: modalProps) => {
    const { statusUpdate, isLoading } = useUpdateKybStatus({ setRefresh, handleCancel });
    return (
        <Drawer title="Collector KYB Details" width={550} onClose={handleCancel} open={open}>
            <Flex vertical>
                <Typography.Text className="text-base font-bold">KYB Details:</Typography.Text>
                <InfoRow label="Corporate Name" value={data?.corporateUser.name} />
                <InfoRow label="Corporate ID" value={data?.corporateUser.credential.username} />
                <InfoRow label="Mobile Number" value={data?.corporateUser.mobileNo} />
                <InfoRow label="Email ID" value={data?.supplierEmail} />
                {/* <InfoRow label="Supplier Code" value={data?.supplierCode.toString()} /> */}
                {/* <InfoRow
                    label="Nature Of Business"
                    value={data?.supplierDetails.natureOfBusiness}
                /> */}
                {/* <InfoRow label="Proof Of Business" value={data?.supplierDetails.websiteLink} /> */}
                <InfoRow
                    label="KYB Status"
                    value={data?.kybStatus
                        .toLowerCase()
                        .replace(/^\w/, (c: string) => c.toUpperCase())}
                />
                <InfoRow label="Reject Reason" value={data?.rejectReason} />

                {data?.supplierDetails?.uploadedDocuments && (
                    <>
                        <DocumentInfo
                            label="Trade License"
                            value={data.supplierDetails.uploadedDocuments.Trade_License?.fileUrl}
                        />
                        <DocumentInfo
                            label="Articles Of Association"
                            value={
                                data.supplierDetails.uploadedDocuments.Articles_Of_Association
                                    ?.fileUrl
                            }
                        />
                        <DocumentInfo
                            label="Emirates ID"
                            value={data.supplierDetails.uploadedDocuments.Emirates_ID?.fileUrl}
                        />
                        <DocumentInfo
                            label="Passport"
                            value={data.supplierDetails.uploadedDocuments.Passport?.fileUrl}
                        />
                        <DocumentInfo
                            label="Bank Letter"
                            value={data.supplierDetails.uploadedDocuments.Bank_Letter?.fileUrl}
                        />
                    </>
                )}

                {data?.agreementDetails && (
                    <>
                        <Typography.Text className="text-base font-bold mt-3">
                            Agreement Details:
                        </Typography.Text>
                        {data.agreementDetails?.agreement_url && (
                            <DocumentInfo
                                label="Agreement"
                                value={data.agreementDetails.agreement_url}
                            />
                        )}
                        <InfoRow label="Agreement Status" value={data.agreementDetails?.status} />
                        {data.agreementDetails?.agreement_sent_date && (
                            <InfoRow
                                label="Agreement Sent Date"
                                value={formattedDateOnly(
                                    new Date(data.agreementDetails.agreement_sent_date)
                                )}
                            />
                        )}
                        {data.agreementDetails?.agreement_signed_date && (
                            <InfoRow
                                label="Agreement Signed Date"
                                value={formattedDateOnly(
                                    new Date(data.agreementDetails.agreement_signed_date)
                                )}
                            />
                        )}
                    </>
                )}

                {data?.kybStatus === 'APPROVED' ? null : (
                    <Formik
                        initialValues={{
                            kybStatus: data?.kybStatus || '',
                            rejectReason: data?.rejectReason || '',
                        }}
                        onSubmit={async values =>
                            statusUpdate({
                                corporateUserId: data?.corporateUserId!,
                                ...values,
                            })
                        }
                        validationSchema={collectorKybSchema}
                    >
                        {({ handleSubmit, values }) => (
                            <Form onFinish={handleSubmit} layout="vertical">
                                <Flex justify="space-between" className="mt-5">
                                    <Typography.Text className="text-base">Status</Typography.Text>
                                    <div className="w-52">
                                        <SelectInput
                                            options={getKybStatusDropdown(data?.kybStatus || '')}
                                            name="kybStatus"
                                            placeholder="Select KYB Status"
                                        />
                                    </div>
                                </Flex>

                                {values.kybStatus === 'REJECTED' && (
                                    <TextAreaInput
                                        name="rejectReason"
                                        label="Remarks"
                                        placeholder="Enter remarks"
                                        size="large"
                                    />
                                )}
                                <Flex justify="end">
                                    <Button onClick={handleCancel}>Cancel</Button>
                                    <Button
                                        type="primary"
                                        danger
                                        htmlType="submit"
                                        loading={isLoading}
                                        className="ml-5"
                                    >
                                        Submit
                                    </Button>
                                </Flex>
                            </Form>
                        )}
                    </Formik>
                )}
            </Flex>
        </Drawer>
    );
};

export default CollectorKybModal;
