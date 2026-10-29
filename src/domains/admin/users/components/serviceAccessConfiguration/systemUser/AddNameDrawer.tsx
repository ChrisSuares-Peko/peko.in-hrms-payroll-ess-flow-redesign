import { ApartmentOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Form, Typography } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';

interface AddNameForm {
    label: string;
}

interface AddNameDrawerProps {
    open: boolean;
    /** e.g. "Category" or "Service" — drives the titles, labels and validation copy. */
    entity: string;
    parentLabel?: string;
    placeholder?: string;
    onClose: () => void;
    onAdd: (label: string) => void;
}

// Generic slide-in drawer for creating a named node (category or leaf service) under a
// given parent — just a name field. On submit it hands the name back to the page.
const AddNameDrawer = ({
    open,
    entity,
    parentLabel,
    placeholder,
    onClose,
    onAdd,
}: AddNameDrawerProps) => {
    const schema = Yup.object().shape({
        label: Yup.string()
            .trim()
            .required(`${entity} name is required`),
    });

    return (
        <Formik<AddNameForm>
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
                                    <ApartmentOutlined />
                                </Flex>
                                <Flex vertical>
                                    <Typography.Text strong className="text-base">
                                        Add {entity}
                                    </Typography.Text>
                                    {parentLabel && (
                                        <Typography.Text type="secondary" className="text-xs">
                                            under “{parentLabel}”
                                        </Typography.Text>
                                    )}
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
                                    Add {entity}
                                </Button>
                            </Flex>
                        }
                    >
                        <Form layout="vertical" onFinish={() => handleSubmit()}>
                            <TextInput
                                isRequired
                                name="label"
                                label={`${entity} Name`}
                                type="text"
                                placeholder={placeholder || `Enter ${entity.toLowerCase()} name`}
                                maxLength={60}
                                classes="rounded-sm"
                            />
                        </Form>
                    </Drawer>
                );
            }}
        </Formik>
    );
};

export default AddNameDrawer;
