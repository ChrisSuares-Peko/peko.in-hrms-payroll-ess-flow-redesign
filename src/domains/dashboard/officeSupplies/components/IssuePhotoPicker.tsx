import { useRef, type FC } from 'react';

import { CloseOutlined, PictureOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { IssuePhoto, MAX_ISSUE_PHOTOS, readIssuePhoto } from '../utils/issuePhoto';

const { Text } = Typography;

interface IssuePhotoPickerProps {
    value: IssuePhoto[];
    onChange: (photos: IssuePhoto[]) => void;
    disabled?: boolean;
}

/**
 * "Photos/Documents" evidence picker (Figma 2807-25222 / 2800-26824) — a dashed
 * "Add photo" tile plus thumbnails of what's been added. Collects raw base64
 * (via readIssuePhoto) into local state the parent owns; the backend uploads
 * them to public URLs and forwards them to the seller. Reused by the raise
 * modal and the reply box.
 */
const IssuePhotoPicker: FC<IssuePhotoPickerProps> = ({ value, onChange, disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const atLimit = value.length >= MAX_ISSUE_PHOTOS;

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = ''; // allow re-picking the same file
        const room = MAX_ISSUE_PHOTOS - value.length;
        const picked = await Promise.all(files.slice(0, room).map(readIssuePhoto));
        const valid = picked.filter((p): p is IssuePhoto => p !== null);
        if (valid.length) onChange([...value, ...valid]);
    };

    return (
        <Flex vertical gap={8}>
            <Text className="text-[14px] font-medium text-[#344054]">Photos / Documents (optional)</Text>
            <Flex gap={12} wrap="wrap">
                {value.map((photo, idx) => (
                    <div
                        key={idx}
                        className="relative flex h-[88px] w-[88px] flex-col items-center justify-center bg-[#f9fafb] overflow-hidden rounded-xl border border-[#e4e7ec]"
                    >
                        {photo.format === 'pdf' ? (
                            <Flex vertical align="center" justify="center" gap={4} className="h-full w-full p-2">
                                <FilePdfOutlined className="text-red-500 text-[24px]" />
                                <span className="text-[10px] text-center font-medium text-[#344054] truncate max-w-full px-1">
                                    {photo.name || 'document.pdf'}
                                </span>
                            </Flex>
                        ) : (
                            <img
                                src={`data:image/${photo.format};base64,${photo.base64}`}
                                alt="attachment"
                                className="h-full w-full object-cover"
                            />
                        )}
                        {!disabled && (
                            <button
                                type="button"
                                aria-label="Remove file"
                                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white z-10"
                            >
                                <CloseOutlined className="text-[10px]" />
                            </button>
                        )}
                    </div>
                ))}

                {!atLimit && (
                    <>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => inputRef.current?.click()}
                            className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#cfcfcf] bg-[#f9fafb] hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <PictureOutlined className="text-lg text-[#667085]" />
                            <span className="text-[12px] font-medium text-lightRed">Add file</span>
                        </button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/png,image/jpeg,application/pdf"
                            multiple
                            onChange={handleFiles}
                            className="hidden"
                        />
                    </>
                )}
            </Flex>
        </Flex>
    );
};

export default IssuePhotoPicker;
