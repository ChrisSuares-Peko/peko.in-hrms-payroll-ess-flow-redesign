import React, { useEffect, useState } from 'react';

import { DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { showToast } from '@src/slices/apiSlice';

import DocFileUpload from './DocFileUpload';

const DocUpload = ({
    label,
    type,
    existingData,
    vehicleId,
    createDoc,
    deteteDoc,
    updateDoc,
}: any) => {
    const dispatch = useDispatch();
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [file, setFile] = useState<any>(existingData?.fileUrl || '');
    const [fileName, setFileName] = useState<string>(existingData?.fileUrl ? label : ''); // Set initial file name state
    // The card is no longer remounted after add/delete, so mirror the saved document into local state.
    useEffect(() => {
        setFile(existingData?.fileUrl || '');
        setFileName(existingData?.fileUrl ? label : '');
    }, [existingData?.id, existingData?.fileUrl, label]);
    const handleDelete = () => {
        deteteDoc(existingData?.id).then((res: any) => {
            if (res) {
                // setRefresh(true);
                dispatch(
                    showToast({
                        description: 'Document deleted successfully',
                        variant: 'success',
                    })
                );
            }
        });
    };
    return (
        <Flex vertical className="w-full">
            <Formik
                enableReinitialize
                initialValues={{
                    vehicleId,
                    type: type || '',
                    expiryDate: existingData?.expiryDate || null,
                    documentBase: '',
                    documentFormat: '',
                }}
                onSubmit={async values => {
                    let res;

                    if (existingData?.fileUrl) {
                        if(existingData.expiryDate === values.expiryDate && values.documentBase === '' && !values.documentFormat){
                            dispatch(
                                showToast({
                                    description: `No changes in the document`,
                                    variant: 'error',
                                })
                            );
                            return
                        }
                        res = await updateDoc(existingData.id, {
                            ...values,
                        });
                    } else {
                        if (values.documentBase === '' || values.documentFormat === '') {
                            dispatch(
                                showToast({
                                    description: `Please upload the document`,
                                    variant: 'error',
                                })
                            );
                            return;
                        }
                        if (values.expiryDate === null) {
                            dispatch(
                                showToast({
                                    description: `Please select the expiry date`,
                                    variant: 'error',
                                })
                            );
                            return;
                        }
                        res = await createDoc({
                            ...values,
                        });
                    }

                    if (res.status === true) {
                        dispatch(
                            showToast({
                                description: `${res.message} `,
                                variant: 'success',
                            })
                        );
                        // setRefresh(true)
                    }

                    if (res.status === false) {
                        dispatch(
                            showToast({
                                description: `${res.message}`,
                                variant: 'error',
                            })
                        );
                    }
                }}
            >
                {({ handleSubmit, isValid, errors, touched }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                        <Typography.Text>{label}</Typography.Text>
                        <Flex
                            className="px-3 py-2 mt-2 border border-gray-200 border-solid rounded-sm h-9"
                            align="center"
                            justify="space-between"
                        >
                            <Flex gap={8}>
                                <PaperClipOutlined />
                                <Typography.Text className="text-sm font-normal">
                                    {fileName ? (
                                        <a
                                            href={file}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: '#ef4444' }} // Tailwind's red-500 hex
                                            className="hover:underline"
                                        >
                                            {fileName}
                                        </a>
                                    ) : (
                                        <span className="">No file uploaded</span>
                                    )}
                                </Typography.Text>
                            </Flex>
                            {
                                existingData?.fileUrl && (
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={()=>setOpenConfirmationModal(true)}
                                    />
                                )
                            }

                        </Flex>
                        <Flex

                            className="flex-col w-full mt-3 sm:flex-row md:gap-x-2 "
                        >
                            <div className="w-full sm:w-auto">
                                <DocFileUpload
                                    name="documentBase"
                                    format="documentFormat"
                                    label={label}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    showFileName
                                    setFile={setFile}
                                    setFileName={setFileName}
                                    existingFileUrl={existingData?.fileUrl}
                                    labelHidden
                                />
                            </div>

                            <div className="w-full sm:w-auto">
                                <DatePickerInput
                                    name="expiryDate"
                                    placeholder="Expiry date"
                                    classes="w-full h-8"
                                    minDate={dayjs(new Date())}
                                    needConfirm={false}
                                    isRequired 
                                    allowClear={false}
                                />
                            </div>

                            <Button
                                type="default"
                                danger
                                className="bg-bgOrange2 h-8 w-full px-4 sm:w-auto mt-[0.1rem]"
                                size="small"
                                htmlType="submit"
                            >
                                Submit
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
            {openConfirmationModal && (
                        <ConfirmationModal
                            isOpen={openConfirmationModal}
                            handleCancel={() => setOpenConfirmationModal(false)}
                            title="Are you sure you want to delete this document? This action will permanently delete the document from your document center."
                            handleSubmit={handleDelete}
                            isLoading={false}
                        />
                    )}
        </Flex>
    );
};

export default DocUpload;
