import React, { useRef, useState } from 'react';

import { Modal, Button } from 'antd';
import ReactCrop, { Crop, PixelCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
    isVisible: boolean; // To open modal
    onClose: () => void; // To close modal
    handleImage: (baseUrl: string, image: string) => void; // To set the base64 image url for image upload.
    imgSrc: string; // Must by a stringified instance of the fileReader().
    aspect?: number; // Aspect is used for the image crop sizing by default it is 1:1 or 1/1.
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
    isVisible,
    onClose,
    handleImage,
    imgSrc,
    aspect = 1 / 1,
}) => {
    const [cropDetails, setCropDetails] = useState<Crop>();
    const imgRef = useRef<HTMLImageElement>(null);
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (aspect) {
            const { width, height } = e.currentTarget;
            setCropDetails(centerAspectCrop(width, height));
        }
    };

    const handleCropSubmit = () => {
        if (completedCrop && imgRef.current) {
            makeClientCrop(completedCrop);
            onClose();
        }
    };

    const makeClientCrop = async (crop: PixelCrop) => {
        if (imgRef.current && crop.width && crop.height) {
            const croppedImage = await getCroppedImg(imgRef.current, crop);
            handleImage(croppedImage.base64, croppedImage.dataUrl);
        }
    };

    const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        ctx?.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise<{ dataUrl: string; base64: string }>((resolve, reject) => {
            canvas.toBlob(blob => {
                if (!blob) {
                    console.error('Canvas is empty');
                    reject(new Error('Canvas is empty'));
                    return;
                }
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const dataUrl = reader.result?.toString() || '';
                    const base64 = dataUrl.split(',')[1]; // Extract the base64 part
                    resolve({ dataUrl, base64 });
                };
            }, 'image/jpeg');
        });
    };

    function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
        return makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        );
    }

    return (
        <Modal
            open={isVisible}
            onCancel={onClose}
            closeIcon={null}
            centered
            zIndex={9999}
            destroyOnClose
            footer={[
                <Button key="back" className="px-5" onClick={onClose}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    danger
                    className="px-5"
                    onClick={handleCropSubmit}
                >
                    Submit
                </Button>,
            ]}
        >
            {!!imgSrc && (
                <ReactCrop
                    crop={cropDetails}
                    onChange={(_, percentCrop) => setCropDetails(percentCrop)}
                    onComplete={c => setCompletedCrop(c)}
                    aspect={aspect}
                    minHeight={100}
                >
                    <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imgSrc}
                        onLoad={onImageLoad}
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                </ReactCrop>
            )}
        </Modal>
    );
};

export default ImageCropModal;
