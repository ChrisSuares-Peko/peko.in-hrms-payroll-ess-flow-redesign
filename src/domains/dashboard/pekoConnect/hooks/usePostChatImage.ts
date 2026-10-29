import { useState } from 'react';

import { postChatImage } from '../api/index';

export default function usePostChatImage() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [data, setData] = useState<string | null>(null);

    const handlepostChatImage = (
        e: React.ChangeEvent<HTMLInputElement>
    ): Promise<string | null> => {
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
                        const res = await postChatImage({
                            image: base64String,
                            imageFormat: extension,
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
                    console.error('Error uploading image:', error);
                    setIsLoading(false);
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    return { handlepostChatImage, isLoading, data };
}
