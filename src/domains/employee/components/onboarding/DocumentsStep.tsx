import { Button, Flex, Form, Typography } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import OnboardingUpload from './OnboardingUpload';
import { RequiredOnboardingDocument } from '../../api/onboarding';
import UserIcon from '../../assets/icons/user.svg';

// Flat, keyed by the HR-configured document `key`: `${key}` holds the base64 string,
// `${key}_format` holds the file extension — FileUploadInput writes to two separate
// top-level fields, it doesn't support nested/dot-path field names.
export type DocumentsValues = Record<string, string>;

interface DocumentsStepProps {
    documents: RequiredOnboardingDocument[];
    initialValues: DocumentsValues;
    onContinue: (values: DocumentsValues) => void | Promise<void>;
}

const DocumentsStep = ({ documents, initialValues, onContinue }: DocumentsStepProps) => {
    const formInitialValues: DocumentsValues = documents.reduce(
        (acc, doc) => ({
            ...acc,
            [doc.key]: initialValues[doc.key] ?? '',
            [`${doc.key}_format`]: initialValues[`${doc.key}_format`] ?? '',
        }),
        {} as DocumentsValues
    );
    const validationSchema = Yup.object(
        Object.fromEntries(
            documents.map(doc => [
                doc.key,
                Yup.string().required(`Please upload your ${doc.label}`),
            ])
        )
    );

    return (
        <Formik
            initialValues={formInitialValues}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={values => onContinue(values)}
        >
            {({ handleSubmit, isSubmitting }) => (
                <Form onFinish={handleSubmit} layout="vertical">
                    <Flex
                        vertical
                        gap={20}
                        className="p-6 bg-white border border-solid border-[#f0f0f0] rounded-2xl"
                        style={{ boxShadow: '0px 1.66px 8px 0px rgba(0, 0, 0, 0.06)' }}
                    >
                        <Flex gap={12} align="center">
                            <img src={UserIcon} alt="" className="size-7" />
                            <Flex vertical>
                                <Typography.Text className="font-semibold">
                                    Identity Documents
                                </Typography.Text>
                                <Typography.Text className="text-xs text-gray-500">
                                    Upload clear scans of your documents. Stored securely for HR
                                    verification only.
                                </Typography.Text>
                            </Flex>
                        </Flex>

                        {documents.length === 0 ? (
                            <Typography.Text className="text-sm text-gray-500">
                                No documents are required for your onboarding. You can continue.
                            </Typography.Text>
                        ) : (
                            documents.map(doc => (
                                <OnboardingUpload
                                    key={doc.key}
                                    name={doc.key}
                                    format={`${doc.key}_format`}
                                    label={doc.label}
                                    isRequired
                                />
                            ))
                        )}
                    </Flex>

                    <Button
                        type="primary"
                        block
                        htmlType="submit"
                        loading={isSubmitting}
                        className="h-12 mt-6 font-medium rounded-lg"
                    >
                        Continue
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default DocumentsStep;
