import { useEffect } from 'react';

import { useFormikContext } from 'formik';

interface Props {
    onChange: (data: { base64: string; format: string } | null) => void;
}

const ImageFormikSync = ({ onChange }: Props) => {
    const { values } = useFormikContext<any>();
    const { profileImage, format } = values;

    useEffect(() => {
        if (profileImage && format) {
            onChange({ base64: profileImage, format });
        } else {
            onChange(null);
        }
    }, [profileImage, format, onChange]);

    return null; // no UI
};

export default ImageFormikSync;
