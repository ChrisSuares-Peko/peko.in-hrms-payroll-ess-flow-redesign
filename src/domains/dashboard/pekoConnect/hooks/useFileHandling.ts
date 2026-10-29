import { useState } from 'react';

import { addDoc, serverTimestamp } from 'firebase/firestore';

import { showToast } from '@src/slices/apiSlice';

export const useFileHandling = (dispatch: any, handlePostChatFile: any, currentUser: any) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | undefined>();
    const [previewVisible, setPreviewVisible] = useState(false);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        const maxFileSizeKB = 2048; // 2MB
        if (selectedFile) {
            if (
                ![
                    'image/jpeg',
                    'image/png',
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ].includes(selectedFile.type)
            ) {
                dispatch(
                    showToast({
                        description: 'Unsupported file format!',
                        variant: 'error',
                    })
                );
                return;
            }

            if (selectedFile.size / 1024 > maxFileSizeKB) {
                dispatch(
                    showToast({
                        description: `File size must be smaller than ${maxFileSizeKB}KB!`,
                        variant: 'error',
                    })
                );
                return;
            }

            setFile(selectedFile);
            const fileReader = new FileReader();
            fileReader.onloadend = () => {
                setPreviewImage(fileReader.result as string);
                setPreviewVisible(true);
            };
            fileReader.readAsDataURL(selectedFile);
        }
    };

    const resetState = () => {
        setPreviewVisible(false);
        setPreviewImage(undefined);
        setFile(null);
    };

    const handleProceedFileSend = async (messagesRef: any) => {
        if (!file) return;

        const fileType = file.type.startsWith('image/') ? 'image' : 'file';
        const fileUrl = await handlePostChatFile({ target: { files: [file] } } as any);

        if (fileUrl) {
            await addDoc(messagesRef, {
                type: fileType,
                fileUrl,
                text: '',
                sender: currentUser.email,
                createdAt: serverTimestamp(),
                seenBy: [],
            });
            resetState();
        }
    };

    return {
        file,
        previewImage,
        previewVisible,
        handleInputChange,
        handleProceedFileSend,
        resetState,
        setPreviewVisible,
    };
};
