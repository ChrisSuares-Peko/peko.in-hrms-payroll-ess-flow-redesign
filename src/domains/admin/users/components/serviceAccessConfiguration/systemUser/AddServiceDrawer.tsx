import { AppstoreAddOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Form, Typography } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';

interface AddServiceForm {
    label: string;
}

interface AddServiceDrawerProps {
    open: boolean;
    onClose: () => void;
    onAdd: (label: string) => void;
}

const schema = Yup.object().shape({
    label: Yup.string().trim().required('Service name is required'),
});

// Slide-in drawer for creating a new service — just a name field. On submit it hands
// the name back to the page, which appends it to the draggable list.
const AddServiceDrawer = ({ open, onClose, onAdd }: AddServiceDrawerProps) => (
        <Formik<AddServiceForm>
            initialValues={{ label: '' }}
            validationSchema={schema}
            enableReinitialize
            onSubmit={(values, { resetForm }) => {
                onAdd(values.label.trim());
                resetForm();
                onClose();
            }}
        >
            {({ handleSubmit, resetForm }) => {
                const handleClose = () => {
                    resetForm();
                    onClose();
                };
                return (
                    <Drawer
                        open={open}
                        onClose={handleClose}
                        width={440}
                        destroyOnClose
                        title={
                            <Flex align="center" gap={10}>
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="h-9 w-9 rounded-xl bg-red-50 text-lg text-brandColor"
                                >
                                    <AppstoreAddOutlined />
                                </Flex>
                                <Flex vertical>
                                    <Typography.Text strong className="text-base">
                                        Add New Service
                                    </Typography.Text>
                                    <Typography.Text type="secondary" className="text-xs">
                                        Give the new service a name
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        }
                        footer={
                            <Flex justify="flex-end" gap={10}>
                                <Button onClick={handleClose} className="px-5">
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    className="px-6"
                                    onClick={() => handleSubmit()}
                                >
                                    Add Service
                                </Button>
                            </Flex>
                        }
                    >
                        <Form layout="vertical" onFinish={() => handleSubmit()}>
                            <TextInput
                                isRequired
                                name="label"
                                label="Service Name"
                                type="text"
                                placeholder="e.g. Bill Payments"
                                maxLength={60}
                                classes="rounded-sm"
                            />
                        </Form>
                    </Drawer>
                );
            }}
        </Formik>
    );

export default AddServiceDrawer;
