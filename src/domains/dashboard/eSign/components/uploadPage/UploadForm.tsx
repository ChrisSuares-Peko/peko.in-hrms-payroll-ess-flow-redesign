import { type FC, useState } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Upload, Typography, Flex, Spin } from 'antd';
import type { UploadProps } from 'antd';
import { useNavigate } from 'react-router-dom';

// import PdfThumbnail from '@components/molecular/pdfViewer/PdfThumbnail';
import { useAppDispatch } from '@src/hooks/store';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import useGetESignCount from '../../hooks/useGetESignCount';
import { setESignDocData } from '../../slices/eSignDocSlice';

interface UploadFormProps {
    // Optional override. When the parent already knows the gate state (ActionsHeader on the
    // landing page) it passes the prop. Direct navigation to /eSign/upload-page renders this
    // form without a parent gate, so the component falls back to computing it from the same
    // hooks ActionsHeader uses — count >= max blocks upload.
    eSignAvailable?: boolean;
}
const { Dragger } = Upload;

const UploadForm: FC<UploadFormProps> = ({ eSignAvailable }) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);

    // Internal gate — only used when parent didn't pass eSignAvailable. `count < max` matches
    // the backend rule (`count >= max` rejects), so a maxLimit of 0 correctly blocks every upload.
    const { count } = useGetESignCount();
    const { addonData } = useGetAddonDetails(accessKeys.eSign, packageAccessKeys.eSign);
    const computedAvailable = (count || 0) < (addonData?.maxLimit || 0);
    const isAvailable = typeof eSignAvailable === 'boolean' ? eSignAvailable : computedAvailable;
    const getBase64 = (file: File): Promise<string | null> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });

    const handleFile = async (file: File) => {
        if (!isAvailable) {
            const max = addonData?.maxLimit ?? 0;
            dispatch(
                showToast({
                    description: max === 0
                        ? "Your plan doesn't include eSign. Upgrade or purchase an add-on to continue."
                        : `You've used all ${max} eSign requests. Purchase an add-on or upgrade to continue.`,
                    variant: 'error',
                })
            );
            return false;
        }
        setLoading(true);
        const isPDF = file.type === 'application/pdf';
        if (!isPDF) {
            dispatch(
                showToast({ description: 'You can only upload PDF files.', variant: 'warning' })
            );
            setLoading(false);
            return false;
        }

        const isNonZeroFileSize = file.size > 0;
        if (!isNonZeroFileSize) {
            dispatch(
                showToast({ description: 'File size must be greater than 0 KB.', variant: 'error' })
            );
            setLoading(false);
            return false;
        }

        const isLt2M = file.size / 1024 / 1024 <= 20;
        if (!isLt2M) {
            dispatch(
                showToast({ description: 'File must be smaller than 20 MB.', variant: 'warning' })
            );
            setLoading(false);
            return false;
        }
        try {
            const base64Data = await getBase64(file);
            const fileNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.'));
            // --for preview
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = e => {
                const newPdfUrl: any = e?.target?.result;
                dispatch(
                    setESignDocData({
                        docket_title: fileNameWithoutExtension,
                        documentBase64: base64Data || '',
                        document_url: newPdfUrl,
                        isDisabled: false,
                    })
                );

                navigate(`${paths.dashboard.eSign}/${paths.eSign.viewPage}`);
                setLoading(false);
            };
        } catch (error) {
            dispatch(
                showToast({
                    description: 'Something went wrong while uploading',
                    variant: 'warning',
                })
            );
            setLoading(false);
            return false;
        }
        return true;
    };

    const props: UploadProps = {
        name: 'file',
        multiple: false,
        maxCount: 1,
        showUploadList: false,
        accept: 'application/pdf',
        beforeUpload: async file => {
            const isValid = await handleFile(file);
            return !isValid ? Upload.LIST_IGNORE : false; // Prevent automatic upload
        },
        onDrop: async e => {
            const { files } = e.dataTransfer;
            if (files.length > 0) {
                const file = files[0];
                const isValid = await handleFile(file);
                if (!isValid) {
                    return Upload.LIST_IGNORE;
                }
            }
            return undefined;
        },
    };

    return (
        <Flex vertical className="mb-10">
            <Dragger {...props} className="bg-white w-full " style={{ minHeight: '12.2rem' }}>
                {loading && (
                    <Flex
                        justify="center"
                        align="center"
                        className="absolute inset-0 bg-white bg-opacity-75"
                    >
                        <Spin tip="Uploading..." />
                    </Flex>
                )}
                <Flex vertical className="mx-5 py-6">
                    <p className="ant-upload-drag-icon text-black">
                        <InboxOutlined />
                    </p>
                    <Typography.Text>Click or drag file to this area to upload</Typography.Text>
                    <Typography.Text className="text-gray-400 font-light">
                        Upload the document in PDF format (max 20 MB).
                    </Typography.Text>
                </Flex>
            </Dragger>
        </Flex>
    );
};

export default UploadForm;
