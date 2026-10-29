import { useMemo } from 'react';

import { Button, Drawer, Flex, Form, Select } from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import TextInput from '@components/atomic/inputs/TextInput';
import { showToast } from '@src/slices/apiSlice';

import CreateAnnouncement from '../../hooks/announcementHooks/useCreateAnnoncementApi';
import { useEmployeeListApi } from '../../hooks/employeeHooks/useEmployeeListApi';
import { addAnouncementSchema } from '../../schema/announcement/AddAnnouncementSchema';

type AnnouncementModalProps = {
    open: boolean;
    handleCancel: () => void;
    setRefresh: (value: any) => void;
};

const AnnouncementModal = ({ open, handleCancel, setRefresh }: AnnouncementModalProps) => {
    const { createAnnouncementHandler } = CreateAnnouncement();
    const { data: employeeList } = useEmployeeListApi({
        employeeStatus: 'active',
        sortField: 'createdAt',
        sortOrder: 'DESC',
        debouncedSearch: '',
    });
    const employeesData = useMemo(
        () =>
            (employeeList || []).map((item, index) => ({
                key: index + 1,
                label: item.personalInformation?.fullName || '-',
                value: item.id,
            })),
        [employeeList]
    );

    const dispatch = useDispatch();

    return (
        <Formik
            initialValues={{
                subject: '',
                details: '',
                excludedEmployees: [],
            }}
            onSubmit={async values => {
                const postData = {
                    subject: values.subject,
                    details: values.details,
                    excludedEmployees: values.excludedEmployees || [],
                };
                const res = await createAnnouncementHandler(postData);
                if (res) {
                    setRefresh(true);
                    dispatch(
                        showToast({
                            description: 'Announcement created successfully',
                            variant: 'success',
                        })
                    );
                    handleCancel();
                }
            }}
            validationSchema={addAnouncementSchema}
            enableReinitialize
        >
            {({ handleSubmit, isSubmitting, values, setFieldValue }) => (
                <Drawer
                    title="Add Announcement"
                    placement="right"
                    closable={false}
                    onClose={handleCancel}
                    open={open}
                    key="right"
                    destroyOnClose
                    width={470}
                    styles={{
                        body: { paddingInline: 20, paddingBlock: 16 },
                        header: { paddingInline: 20 },
                    }}
                    zIndex={10}
                    footer={[
                        <Flex className=" w-full" justify="flex-end" gap={10} key="">
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                loading={isSubmitting}
                                onClick={() => {
                                    handleSubmit();
                                }}
                            >
                                Submit
                            </Button>

                            <Button key="back" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </Flex>,
                    ]}
                >
                    <Flex vertical className="w-full" gap={12}>
                        <Form layout="vertical">
                            <TextInput
                                name="subject"
                                label="Subject"
                                type="text"
                                placeholder="Enter Subject"
                                isRequired
                                classes=" rounded-sm "
                                maxLength={50}
                            />
                            <InputTextArea
                                name="details"
                                placeholder="Enter Details"
                                label="Details"
                                isRequired
                                maxLength={1000}
                                showCount
                            />
                            <Form.Item label="Exclude Employees">
                                <Select
                                    mode="multiple"
                                    allowClear
                                    showSearch
                                    placeholder="Select employees to exclude"
                                    options={employeesData || []}
                                    value={values.excludedEmployees}
                                    onChange={value => setFieldValue('excludedEmployees', value)}
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Form>
                    </Flex>
                </Drawer>
            )}
        </Formik>
    );
};

export default AnnouncementModal;
