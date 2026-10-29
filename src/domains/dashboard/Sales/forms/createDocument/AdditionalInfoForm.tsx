import { useEffect, useState } from 'react';

import { CloseCircleFilled } from '@ant-design/icons';
import { Flex, Form, Typography } from 'antd';
import { useFormikContext } from 'formik';

import FileUploadField from '../../components/shared/FileUploadField';
import RichTextEditorField from '../../components/shared/RichTextEditorField';
import { IMAGE_ACCEPT, IMAGE_MIME_TYPES, IMAGE_TYPES_LABEL } from '../../constants/settings';
import { CreateDocumentFormValues } from '../../types/createDocument';

interface AdditionalInfoFormProps {
    signatureUrl: string | null;
}

const AdditionalInfoForm = ({ signatureUrl }: AdditionalInfoFormProps) => {
    const { values, setFieldValue } = useFormikContext<CreateDocumentFormValues>();
    const { signature, removeSignature } = values.additional;
    const [localPreview, setLocalPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!signature) {
            setLocalPreview(null);
            return undefined;
        }
        const url = URL.createObjectURL(signature);
        setLocalPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [signature]);

    const displaySrc = localPreview || (!removeSignature ? signatureUrl : null);

    const handleRemove = () => {
        setFieldValue('additional.signature', null);
        setFieldValue('additional.removeSignature', true);
    };

    return (
        <Form layout="vertical" className="w-full xl:flex-1 [&_.ant-form-item]:mb-2">
            <Flex vertical gap={6}>
                <Typography.Text className="text-xl font-medium">
                    Additional Information
                </Typography.Text>

                <RichTextEditorField
                    name="additional.termsAndConditions"
                    label="Terms & Conditions"
                    placeholder="Enter Terms & Conditions"
                />

                <RichTextEditorField
                    name="additional.notes"
                    label="Notes"
                    placeholder="Enter Notes"
                />

                <Flex vertical gap={4}>
                    {displaySrc ? (
                        <Flex vertical gap={4}>
                            <Typography.Text className="text-sm font-medium text-[#344054]">
                                Signature
                            </Typography.Text>
                            <Flex
                                align="center"
                                justify="center"
                                className="relative border border-dashed border-[#E4E4E7] rounded-lg bg-[#fafafa] w-full h-[100px]"
                            >
                                <img
                                    src={displaySrc}
                                    alt="Signature"
                                    className="max-w-full max-h-full object-fill"
                                />
                                <CloseCircleFilled
                                    className="absolute top-2 right-2 text-[#A1A1AA] hover:text-red-500 text-base cursor-pointer"
                                    onClick={handleRemove}
                                />
                            </Flex>
                        </Flex>
                    ) : (
                        <FileUploadField
                            label="Upload Signature"
                            fieldName="additional.signature"
                            uploadLabel="Click to upload signature"
                            allowedTypes={IMAGE_MIME_TYPES}
                            acceptedTypesLabel={IMAGE_TYPES_LABEL}
                            accept={IMAGE_ACCEPT}
                            maxFileSizeMB={2}
                            displayName="Signature.png"
                            removeFieldName="additional.removeSignature"
                        />
                    )}
                </Flex>
            </Flex>
        </Form>
    );
};

export default AdditionalInfoForm;
