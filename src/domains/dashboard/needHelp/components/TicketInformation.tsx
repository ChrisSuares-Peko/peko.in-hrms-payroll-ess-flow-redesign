/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Col, Flex, Typography, Divider, Button, Form } from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateTime } from '@utils/dateFormat';

import { useDeleteTicketApi } from '../hooks/useTicketDeleteApi';
import { useTicketUpdate } from '../hooks/useTicketUpdateApi';
import { singleTicketData } from '../types/type';

const { Text } = Typography;

type Props = {
    chatId: number | null;
    onTabChange: () => void;
    data?: singleTicketData;
    setReload: React.Dispatch<React.SetStateAction<boolean>>;
};

const TicketInformation = ({ chatId, onTabChange, data, setReload }: Props) => {
    const dispatch = useDispatch();
    const attachmentId = data?.attachments[0] ? data?.attachments[0].id : null;
    const [file, setFile] = useState<any>('');
    const { handleTicketUpdate, isLoading } = useTicketUpdate(chatId);

    const { deleteTicketData, loading } = useDeleteTicketApi(chatId);

    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

    const handleDelete = useCallback(async () => {
        try {
            await deleteTicketData();
            onTabChange();
            setOpenConfirmationModal(false);
        } catch (error) {
            // console.error('Error deleting ticket:', error);
        }
    }, [deleteTicketData, onTabChange]);

    const handleDeleteImage = useCallback(() => {
        if (attachmentId && data?.status !== 'Closed' && data?.status !== 'Resolved') {
            handleTicketUpdate({
                screenshot: null,
                attachmentId,
            }).then(() => {
                dispatch(
                    showToast({ variant: 'success', description: 'Image deleted successfully' })
                );
                setReload(v => !v);
            });
            return true;
        }
        return true;
    }, [attachmentId, data?.status, dispatch, handleTicketUpdate, setReload]);

    const { moduleDetails, issueDetails } = useAppSelector(state => state.reducer.support);

    return (
        <Col
            xs={24}
            md={6}
            className="h-full p-2 rounded-md sm:rounded-2xl sm:m-2 sm:p-4 sm:bg-chatCardBg"
        >
            <Flex className="mt-4" justify="space-between">
                <Text className="sm:text-xl sm:font-medium ms-4">Ticket Information</Text>
                <DeleteOutlined
                    data-testid="delete-icon"
                    className="text-iconRed"
                    onClick={() => setOpenConfirmationModal(true)}
                />
            </Flex>
            <Divider />
            <Flex vertical className="sm:mx-4 md:gap-5">
                <Flex className="w-full">
                    <Flex vertical className="mt-2 w-1/2">
                        <Text className="text-titleText">Ticket ID</Text>
                        <Text className="my-2 text-black">{data?.id}</Text>
                    </Flex>
                    <Flex vertical className="my-2 w-1/2">
                        <Text className=" text-titleText">Status</Text>
                        <Text className="my-2 text-black">{data?.status}</Text>
                    </Flex>
                </Flex>
                <Flex vertical className="my-2">
                    <Text className=" text-titleText">Date</Text>
                    <Text className="my-2 text-black">
                        {data?.created_at ? formattedDateTime(new Date(data.created_at)) : ''}
                    </Text>
                </Flex>

                <Flex vertical>
                    <Formik
                        enableReinitialize
                        initialValues={{
                            issueType: data?.type || undefined,
                            module: data?.custom_fields.cf_module || undefined,
                            screenshot: data?.attachments[0]?.attachment_url || '',
                            attachmentId: data?.attachments[0] ? data?.attachments[0].id : null,
                        }}
                        onSubmit={async (values, { resetForm }) => {
                            try {
                                handleTicketUpdate(values).then(() => {
                                    dispatch(
                                        showToast({
                                            variant: 'success',
                                            description: 'Ticket updated successfully',
                                        })
                                    );
                                    resetForm();
                                    setReload(v => !v);
                                });
                            } catch (error) {
                                // console.error('Error updating ticket:', error);
                            }
                        }}
                    >
                        {({ handleSubmit }) => (
                            <Form
                                onFinish={handleSubmit}
                                className="flex flex-col w-full gap-3"
                                layout="vertical"
                            >
                                <SelectInput
                                    options={issueDetails}
                                    name="issueType"
                                    label="Issue Type"
                                    placeholder="Select issue type"
                                    classes=" rounded-sm "
                                />
                                <SelectInput
                                    options={moduleDetails}
                                    name="module"
                                    label="Module"
                                    placeholder="Select module"
                                    classes=" rounded-sm "
                                />
                                <CustomFileUploadInput
                                    label="File Upload"
                                    name="screenshot"
                                    setFile={setFile}
                                    format="screenshotImageFormat"
                                    classes="w-full"
                                    maxFileSize={500}
                                    existingFileUrl={data?.attachments[0]?.attachment_url}
                                    showFileName
                                    handleRemove={handleDeleteImage}
                                />
                                {data?.status !== 'Closed' && data?.status !== 'Resolved' ? (
                                    <Button
                                        className="w-fit sm:mt-3"
                                        size="middle"
                                        type="primary"
                                        loading={isLoading}
                                        danger
                                        onClick={() => handleSubmit()}
                                        data-testid="update-button"
                                    >
                                        Update
                                    </Button>
                                ) : (
                                    <Button
                                        disabled
                                        className="w-fit sm:mt-3"
                                        size="middle"
                                        type="primary"
                                        loading={isLoading}
                                        danger
                                        data-testid="update-button"
                                    >
                                        Update
                                    </Button>
                                )}
                            </Form>
                        )}
                    </Formik>
                </Flex>
            </Flex>
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this ticket?"
                handleSubmit={() => handleDelete()}
                isLoading={false}
            />
        </Col>
    );
};

export default React.memo(TicketInformation);
