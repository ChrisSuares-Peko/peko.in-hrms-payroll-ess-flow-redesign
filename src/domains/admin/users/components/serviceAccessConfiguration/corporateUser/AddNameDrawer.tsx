import { ClusterOutlined, InfoCircleOutlined, TagsOutlined } from '@ant-design/icons';
import { Button, Divider, Drawer, Flex, Form, Select, Typography } from 'antd';
import { Field, FieldProps, Formik } from 'formik';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { ServiceOperatorOption } from '../../../types/systemUserTypes';

interface AddNameForm {
    label: string;
    serviceOperator?: string;
    pathKey: string;
    tags: string[];
}

export interface SelectedOperator {
    serviceProviderId: number;
    accessKey: string;
}

export interface SearchMeta {
    pathKey: string;
    tags: string[];
}

interface AddNameDrawerProps {
    open: boolean;
    /** e.g. "Service" or "Sub-service" — drives titles, labels and validation copy. */
    entity: string;
    parentLabel?: string;
    placeholder?: string;
    operators: ServiceOperatorOption[];
    operatorLoading?: boolean;
    /** When set, the drawer is in edit mode and prefills these values. */
    isEdit?: boolean;
    initialLabel?: string;
    initialOperatorValue?: string;
    initialPathKey?: string;
    initialTags?: string[];
    onClose: () => void;
    // operator is undefined when none selected (or cleared).
    onSubmitValue: (
        label: string,
        operator: SelectedOperator | undefined,
        meta: SearchMeta
    ) => void;
}

// Free-form tag entry (type + Enter). Backed by antd's Select "tags" mode so users
// aren't limited to a preset list — matches the `tags: string[]` shape sent to the backend.
const TagsField = ({ name }: { name: string }) => (
    <Field name={name}>
        {({ field, form: { setFieldValue, setFieldTouched } }: FieldProps<string[]>) => (
            <Form.Item
                label="Search Tags"
                tooltip={{
                    title: 'Keywords that help users find this in search — press Enter after each one',
                    icon: <InfoCircleOutlined />,
                }}
            >
                <Select
                    {...field}
                    mode="tags"
                    value={field.value ?? []}
                    tokenSeparators={[',']}
                    placeholder="e.g. dashboard, home, overview"
                    className="rounded-sm"
                    allowClear
                    suffixIcon={<TagsOutlined className="text-gray-400" />}
                    notFoundContent={null}
                    onChange={(values: string[]) => {
                        setFieldTouched(name, true);
                        setFieldValue(name, values);
                    }}
                    onBlur={() => setFieldTouched(name, true)}
                />
            </Form.Item>
        )}
    </Field>
);


// Indigo-themed drawer for the Corporate User Configuration page. Adds/edits a name and
// an optional service operator; when an operator is chosen its id + accessKey are stored
// on the node (serviceProviderId / accessKey). Also captures search metadata (pathKey + tags)
// persisted to settings.searchServices.
const AddNameDrawer = ({
    open,
    entity,
    parentLabel,
    placeholder,
    operators,
    operatorLoading,
    isEdit = false,
    initialLabel = '',
    initialOperatorValue,
    initialPathKey = '',
    initialTags = [],
    onClose,
    onSubmitValue,
}: AddNameDrawerProps) => {
    const schema = Yup.object().shape({
        label: Yup.string().trim().required(`${entity} name is required`),
        pathKey: Yup.string()
            .trim(),
        tags: Yup.array().of(Yup.string()),
    });
    const actionText = isEdit ? 'Save' : `Add ${entity}`;

    return (
        <Formik<AddNameForm>
            initialValues={{
                label: initialLabel,
                serviceOperator: initialOperatorValue,
                pathKey: initialPathKey,
                tags: initialTags,
            }}
            validationSchema={schema}
            enableReinitialize
            onSubmit={(values, { resetForm }) => {
                const operator = operators.find(op => op.value === values.serviceOperator);
                onSubmitValue(
                    values.label.trim(),
                    operator
                        ? {
                              serviceProviderId: Number(operator.value),
                              accessKey: operator.accessKey,
                          }
                        : undefined,
                    { pathKey: values.pathKey.trim(), tags: values.tags ?? [] }
                );
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
                                    <ClusterOutlined />
                                </Flex>
                                <Flex vertical>
                                    <Typography.Text strong className="text-base">
                                        {isEdit ? `Edit ${entity}` : `Add ${entity}`}
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
                                    {actionText}
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
                            <SelectInput
                                name="serviceOperator"
                                label="Service Operator"
                                placeholder="Select a service operator (optional)"
                                options={operators}
                                showSearch
                                allowClear
                                filterOption
                                optionFilterProp="children"
                               
                            />

                            <Divider orientation="left" orientationMargin={0} className="!my-4">
                                <Typography.Text
                                    type="secondary"
                                    className="text-xs uppercase tracking-wide"
                                >
                                    Search &amp; Discoverability
                                </Typography.Text>
                            </Divider>

                            <TextInput
                                name="pathKey"
                                label="Path Key"
                                type="text"
                                placeholder="e.g. billPayments or taxAndMore/taxRegistration"
                                maxLength={80}
                                classes="rounded-sm"
                                showToolTip
                                tooltipText="Alphabets only, plus / - _ — used to route search results to this page"
                            />
                            <TagsField name="tags" />
                        </Form>
                    </Drawer>
                );
            }}
        </Formik>
    );
};

export default AddNameDrawer;
