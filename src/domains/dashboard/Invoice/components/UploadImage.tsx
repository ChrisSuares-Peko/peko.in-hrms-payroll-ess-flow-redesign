import React, { useCallback, useEffect, useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Upload, Image, Flex } from 'antd';
import { useFormikContext } from 'formik';
import { useSelector, useDispatch } from 'react-redux';

import ImageCropModal from '@components/molecular/modals/ImageCropModal';
import { showToast } from '@src/slices/apiSlice';
import { RootState } from '@store/store';

import { setRecipientDetails } from '../slices/InvoicesSlices';

const UploadImage: React.FC = () => {
    const { setFieldValue } = useFormikContext<any>();
    const { user } = useSelector((state: RootState) => state.reducer.user);
    const dispatch = useDispatch();
    const { recipientDetails } = useSelector((state: RootState) => state.reducer.invoices);

    const [visible, setVisible] = useState(false);
    const [isCropModalVisible, setIsCropModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageInfo, setImageInfo] = useState<any>({
        url: user?.logo,
        type: 'image/png',
    });

    const beforeUpload = useCallback(
        (file: File) => {
            const isJpegOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
            const isLt1MB = file.size / 1024 / 1024 <= 1;

            if (!isJpegOrPng) {
                dispatch(
                    showToast({
                        description: 'You can only upload jpeg or png image.',
                        variant: 'error',
                    })
                );
            }

            if (!isLt1MB) {
                dispatch(
                    showToast({ description: 'Image must be smaller than 1MB!', variant: 'error' })
                );
            }

            return isJpegOrPng && isLt1MB;
        },
        [dispatch]
    );

    const setValue = useCallback(
        ({ file, onSuccess }: any) => {
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        setSelectedImage(reader.result); // Set selected image for cropping modal
                        setIsCropModalVisible(true); // Open crop modal
                    }
                };
                reader.readAsDataURL(file);
                onSuccess('ok');
            }
        },
        [setSelectedImage, setIsCropModalVisible]
    );

    const handleImageCrop = useCallback(
        (base64: string, image: string) => {
            setImageInfo({ url: image, type: 'image/png' }); // Update component's state
            setFieldValue('logo', base64); // Update Formik state with base64 image
            dispatch(
                setRecipientDetails({
                    ...recipientDetails,
                    logo: { imageBase: base64, imageFormat: 'png' },
                })
            );
            setIsCropModalVisible(false); // Close the crop modal
            setVisible(false);
        },
        [setImageInfo, setFieldValue, dispatch, recipientDetails]
    );

    const handleDeleteImage = useCallback(() => {
        setImageInfo({ url: null, type: null });
        setFieldValue('logo', null); // Clear Formik state
        // dispatch(showToast({ description: 'File removed successfully', variant: 'success' }));
        dispatch(
            setRecipientDetails({
                ...recipientDetails,
                logo: { imageBase: '', imageFormat: '' },
            })
        );
    }, [setImageInfo, setFieldValue, dispatch, recipientDetails]);

    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    useEffect(() => {
        if (recipientDetails.logo?.imageBase) {
            setImageInfo({
                url: `data:image/png;base64,${recipientDetails.logo.imageBase}`,
                type: 'image/png',
            });
        }
    }, [recipientDetails, imageInfo.url]);

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseMove={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Upload
                className="w-full"
                multiple={false}
                name="logo"
                maxCount={1}
                onRemove={handleDeleteImage}
                listType="picture-card"
                showUploadList={false}
                beforeUpload={beforeUpload}
                customRequest={setValue}
                accept=".jpeg, .jpg, .png"
            >
                {imageInfo.url ? (
                    <Flex
                        style={{
                            width: '148px',
                            height: '100%',
                            overflow: 'hidden',
                            position: 'relative',
                            borderRadius: '10px',
                        }}
                    >
                        <Image
                            preview={false}
                            src={imageInfo.url}
                            alt="Uploaded Logo"
                            loading="eager"
                            style={{
                                width: '148px',
                                height: '100%',
                                // objectFit: 'cover',
                                opacity: visible ? 0.3 : 1,
                            }}
                        />
                    </Flex>
                ) : (
                    <button style={{ border: 0, background: 'none' }} type="button">
                        <Flex justify="center" className="font-medium mb-2">
                            Upload Logo
                        </Flex>
                        <Flex justify="center" style={{ fontSize: '10px' }}>
                            Drag your file(s) or browse 90x90px
                        </Flex>
                    </button>
                )}
            </Upload>
            {imageInfo.url && visible && (
                <Flex className="absolute top-0 left-0 w-full h-full justify-center items-center">
                    <DeleteOutlined
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={handleDeleteImage}
                        className="text-textRed text-lg"
                    />
                </Flex>
            )}
            <ImageCropModal
                isVisible={isCropModalVisible}
                onClose={() => setIsCropModalVisible(false)}
                handleImage={handleImageCrop}
                imgSrc={selectedImage || ''}
            />
        </div>
    );
};

export default UploadImage;
