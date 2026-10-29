import { useState } from 'react';

import { postChatFile } from '../api/index';

export default function usePostChatFile() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [data, setData] = useState<string | null>(null);

    const handlePostChatFile = (e: React.ChangeEvent<HTMLInputElement>): Promise<string | null> => {
        const file = e.target.files?.[0];
        if (!file) return Promise.resolve(null);

        setIsLoading(true);

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async event => {
                try {
                    const result = (event.target as FileReader).result as string;
                    const base64String = result.split(',')[1];
                    const extension = file.name.split('.').pop();
                    if (extension) {
                        const res = await postChatFile({
                            file: base64String,
                            fileFormat: extension,
                            fileName: file.name,
                        });
                        const publicUrl = res?.publicUrl;
                        setData(publicUrl);
                        setIsLoading(false);
                        resolve(publicUrl);
                    } else {
                        setIsLoading(false);
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error uploading file:', error);
                    setIsLoading(false);
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    return { handlePostChatFile, isLoading, data };
}
