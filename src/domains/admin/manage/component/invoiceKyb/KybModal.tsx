import React from 'react';

import { Button, Drawer, Flex, Form } from 'antd';
import { Typography } from 'antd/lib';
import { Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';

import InfoRow from './InfoRow';
import useUpdateKybStatus from '../../hooks/collectorKyb/useUpdateKybStatus';
import { collectorKybSchema } from '../../schema/collectorKybSchema';
import { Records } from '../../types/collectorKyb';
import { getKybStatusDropdown } from '../../utils/collectorKyb';

interface modalProps {
    open: boolean;
    handleCancel: () => void;
    data: Records;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}
const CollectorKybModal = ({ open, handleCancel, data, setRefresh }: modalProps) => {
    const { statusUpdate, isLoading } = useUpdateKybStatus({ setRefresh, handleCancel });
    return (
        <Drawer
            title="Collector KYB Details"
            width={550}
            styles={{ body: { padding: '10px 45px' } }}
            onClose={handleCancel}
            open={open}
            closable={false}
        >
            <Flex vertical>
                <InfoRow label="Corporate Name" value={data?.corporateUser.name} />
                <InfoRow label="Corporate ID" value={data?.corporateUser.credential.username} />
                <InfoRow label="Mobile Number" value={data?.corporateUser.mobileNo} />
                <InfoRow label="Email ID" value={data?.supplierEmail} />

                <InfoRow
                    label="KYB Status"
                    value={data.kybStatus ? data.kybStatus.toLocaleLowerCase() : '-'}
                />
                <InfoRow
                    label="KYB Status"
                    value={data.eSignStatus ? data.eSignStatus.toLocaleLowerCase() : '-'}
                />

                {/* {data?.kybStatus === 'APPROVED' && ( */}
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
                                <Typography.Text className="text-base">KYB Status</Typography.Text>
                                <div className="w-52">
                                    <SelectInput
                                        options={getKybStatusDropdown(data?.kybStatus || '')}
                                        name="kybStatus"
                                        placeholder="Select KYB Status"
                                    />
                                </div>
                            </Flex>

                            <TextAreaInput
                                name="rejectReason"
                                label="Remarks"
                                placeholder="Enter remarks"
                                size="large"
                            />
                            {/* {values.kybStatus === 'REJECTED' && (
                            )} */}
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
                {/* )} */}
            </Flex>
        </Drawer>
    );
};

export default CollectorKybModal;
