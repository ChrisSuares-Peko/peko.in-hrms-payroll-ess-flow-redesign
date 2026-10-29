import { useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Flex, Form, Row, Skeleton, Typography } from 'antd';
import { FieldArray, Formik } from 'formik';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useUpdateWork from '../../hooks/useUpdateWorks';
import worksSchema from '../../schema/worksSchema';
import { WorkData, refresh } from '../../types/works';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: WorkData;
};

const WorksModal = ({ open, handleCancel, data, setRefresh }: DepartmentModalProps & refresh) => {
    const workId = data?.id;
    const [, setFile] = useState<any>('');
    const [searchText, setSearchText] = useState<string>('');
    const { isLoading, createNewWork, updateCurrentWork, categoryData } = useUpdateWork(searchText);
    const dispatch = useAppDispatch();
    const { partnerData } = usePartnersForCorporate('');
    return (
        <Drawer
            title="Work Management"
            open={open}
            onClose={() => {
                handleCancel();
            }}
            closeIcon={null}
            width={470}
            styles={{
                body: { paddingInline: 20, paddingBlock: 16 },
                header: { paddingInline: 20 },
            }}
            zIndex={20}
            footer={[]}
        >
            <Formik
                initialValues={{
                    name: data?.name || '',
                    features: data?.features || '',
                    description: data?.description || '',
                    contactName: data?.contactName || '',
                    contactEmail: data?.contactEmail || '',
                    contactMobile: data?.contactMobile || '',
                    status: data?.status || true,
                    vendorId: data?.vendorId?.toString() || '',
                    partnerId: Number(data?.credentialId) || '',
                    imageBase: data?.image || '',
                    imageFormat: null,
                    portfolio: data?.portfolio ? data?.portfolio : [{ portfolio_1: '' }],
                }}
                validationSchema={worksSchema}
                onSubmit={async values => {
                    let res: any;
                    const { partnerId, ...restValues } = values;
                    const payload = {
                        ...restValues,
                        credentialId: partnerId,
                    };
                    if (data) {
                        res = await updateCurrentWork({
                            ...payload,
                            workId,
                        });
                    } else {
                        res = await createNewWork({
                            ...payload,
                        });
                    }

                    if (res.status === true) {
                        setRefresh(true);
                        if (data)
                            dispatch(
                                showToast({
                                    description: `Work updated successfully`,
                                    variant: 'success',
                                })
                            );
                        else
                            dispatch(
                                showToast({
                                    description: `Work added successfully`,
                                    variant: 'success',
                                })
                            );
                    }
                    if (res.status === false) {
                        dispatch(
                            showToast({
                                description: `${res.message}`,
                                variant: 'error',
                            })
                        );
                    }
                    handleCancel();
                }}
            >
                {({ handleSubmit, values, setFieldValue }) => (
                    <Form onFinish={handleSubmit} layout="vertical">
                        {partnerData && (
                            <SelectInput
                                name="partnerId"
                                options={partnerData}
                                placeholder="Please select a partner"
                                label="Select Partner"
                                isRequired
                                handleChange={value => setFieldValue('partnerId', value)}
                            />
                        )}
                        <TextInput
                            name="name"
                            label="Work Name"
                            type="text"
                            placeholder="Please enter work name"
                            isRequired
                            classes=" rounded-sm"
                        />
                        <TextInput
                            name="features"
                            label="Features"
                            type="text"
                            placeholder="Please enter features"
                            isRequired
                            classes=" rounded-sm"
                        />
                        <TextInput
                            name="description"
                            label="Description"
                            type="text"
                            placeholder="Please enter description"
                            isRequired
                            classes=" rounded-sm"
                        />
                        <TextInput
                            name="contactName"
                            label="POC Name"
                            type="text"
                            placeholder="Please enter name"
                            isRequired
                            classes=" rounded-sm"
                        />
                        <TextInput
                            name="contactEmail"
                            label="POC Email"
                            type="text"
                            placeholder="Please enter email"
                            isRequired
                            classes=" rounded-sm"
                        />
                        <TextInput
                            name="contactMobile"
                            label="POC Mobile"
                            type="text"
                            placeholder="Please enter mobile"
                            isRequired
                            classes=" rounded-sm"
                            maxLength={10}
                            allowNumbersOnly
                        />
                        {categoryData ? (
                            <SelectInput
                                filterOption={false}
                                allowClear
                                onSearch={setSearchText}
                                showSearch
                                isRequired
                                name="vendorId"
                                options={categoryData}
                                placeholder="Please select a Vendor"
                                label="Select Vendor"
                            />
                        ) : (
                            <Skeleton.Input active block />
                        )}
                        <CustomFileUploadInput
                            existingFileUrl={data?.image}
                            label="Upload Work Image"
                            name="imageBase"
                            setFile={setFile}
                            format="imageFormat"
                            showNotification
                            showFileName
                            isRequired
                        />

                        <Row>
                            <Col className="mb-2">
                                <FieldArray name="portfolio">
                                    {({ push, remove }) => (
                                        <>
                                            {values.portfolio.map((_: any, index: any) => (
                                                <>
                                                    <Flex className="" key={index}>
                                                        {data ? (
                                                            <CustomFileUploadInput
                                                                existingFileUrl={`portfolio[${index}].portfolio_${index + 1}`}
                                                                label={`Upload Portfolio Image ${index + 1}`}
                                                                name={`portfolio[${index}].portfolio_${index + 1}.base64`}
                                                                setFile={setFile}
                                                                format={`portfolio[${index}].portfolio_${index + 1}.format`}
                                                                showNotification
                                                                showFileName
                                                            />
                                                        ) : (
                                                            <CustomFileUploadInput
                                                                existingFileUrl=""
                                                                label={`Upload Work Image ${index + 1}`}
                                                                name={`portfolio[${index}].portfolio_${index + 1}.base64`}
                                                                setFile={setFile}
                                                                format={`portfolio[${index}].portfolio_${index + 1}.format`}
                                                                showNotification
                                                                showFileName
                                                            />
                                                        )}
                                                        {index > 0 && (
                                                            <DeleteOutlined
                                                                onClick={() => remove(index)}
                                                                className="text-xl text-bgOrange2 mt-1"
                                                            />
                                                        )}
                                                    </Flex>
                                                    {/* <ErrorMessage
                                            name={`portfolio[${index}].portfolio_${index + 1}`}
                                            render={msg => (
                                                <div className="error-message -mt-6 text-red-400">
                                                    {msg}
                                                </div>
                                            )}
                                        /> */}
                                                </>
                                            ))}
                                        </>
                                    )}
                                </FieldArray>
                            </Col>
                            <Col>
                                <FieldArray name="portfolio">
                                    {({ push }) =>
                                        values.portfolio.length < 10 && (
                                            <Typography.Text
                                                className=" text-xs font-medium text-red-400 cursor-pointer "
                                                onClick={() =>
                                                    push({
                                                        [`portfolio_${values.portfolio.length + 1}`]:
                                                            '',
                                                    })
                                                }
                                            >
                                                Add more
                                            </Typography.Text>
                                        )
                                    }
                                </FieldArray>
                            </Col>
                        </Row>
                        <Flex className="w-full " justify="flex-end" gap={10} key="">
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                loading={isLoading}
                                className="px-5"
                                htmlType="submit"
                            >
                                Submit
                            </Button>

                            <Button
                                key="back"
                                onClick={() => {
                                    handleCancel();
                                }}
                                className="px-5"
                            >
                                Cancel
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Drawer>
    );
};

export default WorksModal;
