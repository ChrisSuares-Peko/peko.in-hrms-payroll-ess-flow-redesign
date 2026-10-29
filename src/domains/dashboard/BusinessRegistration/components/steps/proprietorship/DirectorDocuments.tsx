import { useRef, useState } from 'react';

import { CheckCircleFilled, LoadingOutlined, UserOutlined } from '@ant-design/icons';
import { Col, Row, Typography } from 'antd';
import { useField, useFormikContext } from 'formik';

import { useDocAutoUpload } from '../../../hooks/useDocAutoUpload';
import { EntityType } from '../../../types';
import {
    DIRECTOR_PHOTO,
    DocPerson,
    getDocPeopleGroup,
    isPartnerEntity,
    personDisplayName,
    personDocFields,
    singlePersonLabel,
} from '../../../utils/proprietorDocuments';
import FieldError from '../../FieldError';
import FileUploadField from '../../FileUploadField';

const { Text } = Typography;

const PhotoUpload = ({ name }: { name: string }) => {
    const [field, , helpers] = useField(name);
    const inputRef = useRef<HTMLInputElement>(null);
    const { status, upload } = useDocAutoUpload(name);
    // {name, base64} after a fresh pick; a filename string once uploaded / on a
    // resumed draft (base64 stripped). Show the image preview when we have the
    // bytes, else an "uploaded" tick.
    const value = field.value as { name?: string; base64?: string } | string | undefined;
    const previewSrc =
        typeof value === 'object' && value?.base64 ? `data:image/jpeg;base64,${value.base64}` : '';
    const hasFile = Boolean(value);
    // The picked image, kept for preview through upload (base64 is dropped from the
    // field on success). Gated on `value` so it hides if the upload is rejected.
    const [preview, setPreview] = useState('');
    const img = value ? preview || previewSrc : '';
    // A filename string (base64 dropped) means it's uploaded to the vendor.
    const uploaded = typeof value === 'string' && Boolean(value);

    // Store {name, base64} then upload to the vendor on the go (base64 dropped on
    // success). Vendor rule: the passport-size photo must be a JPEG under 100 KB.
    const handlePick = (file?: File) => {
        if (!file) return;
        const isJpeg = /image\/jpe?g/i.test(file.type) || /\.jpe?g$/i.test(file.name);
        if (!isJpeg) {
            helpers.setError('Photo must be a JPEG image');
            helpers.setTouched(true, false);
            return;
        }
        if (file.size > 100 * 1024) {
            helpers.setError('Photo must be under 100 KB');
            helpers.setTouched(true, false);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = String(reader.result).split(',')[1] ?? '';
            setPreview(`data:image/jpeg;base64,${base64}`);
            upload({ name: file.name, base64 });
        };
        reader.readAsDataURL(file);
    };

    return (
        <button
            type="button"
            title={hasFile ? 'Click to replace the photo' : 'Upload a JPEG photo'}
            onClick={() => inputRef.current?.click()}
            className={`w-[72px] h-[72px] rounded-[12px] border border-dashed flex flex-col items-center justify-center gap-1 overflow-hidden ${
                hasFile ? 'border-[#ff4f4f] bg-[#fff7f8]' : 'border-[#d9d9d9] bg-[#fafafa]'
            }`}
        >
            {(() => {
                if (img) {
                    return (
                        <div className="relative w-full h-full">
                            <img src={img} alt="Director" className="w-full h-full object-cover" />
                            {status === 'uploading' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <LoadingOutlined style={{ fontSize: 18, color: '#fff' }} />
                                </div>
                            )}
                            {uploaded && (
                                <CheckCircleFilled
                                    className="absolute bottom-0.5 right-0.5 rounded-full bg-white"
                                    style={{ fontSize: 14, color: '#22c55e' }}
                                />
                            )}
                        </div>
                    );
                }
                if (status === 'uploading') {
                    return (
                        <>
                            <LoadingOutlined style={{ fontSize: 20, color: '#ff4f4f' }} />
                            <span className="text-[10px] text-[#6a7282]">Uploading…</span>
                        </>
                    );
                }
                if (hasFile) {
                    return (
                        <>
                            <CheckCircleFilled style={{ fontSize: 20, color: '#52c41a' }} />
                            <span className="text-[10px] text-[#6a7282]">Uploaded</span>
                        </>
                    );
                }
                return (
                    <>
                        <UserOutlined className="text-[#94a3b8]" style={{ fontSize: 20 }} />
                        <span className="text-[10px] text-[#6a7282]">Browse File</span>
                    </>
                );
            })()}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg"
                className="hidden"
                onChange={e => {
                    handlePick(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
        </button>
    );
};

interface PersonDocsCardProps {
    label: string;
    index: number;
    // Field path base, e.g. 'documents.directors.0' — keeps every upload tied to
    // the person at that index so the backend/vendor mapping stays accurate.
    base: string;
    personName?: string;
    nationality?: string;
    hasDin?: boolean;
    // LLP designated partners don't submit a passport photo (vendor-approved flow).
    showPhoto?: boolean;
    entityType?: EntityType;
}

const PersonDocsCard = ({
    label,
    index,
    base,
    personName,
    nationality,
    hasDin,
    showPhoto = true,
    entityType,
}: PersonDocsCardProps) => (
    <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-5">
        {/* Wraps on a phone: role label + badge + "— Full Name" overflows a 320px card,
            and the name alone can be longer than the card is wide. */}
        <div className="flex flex-wrap items-center gap-2">
            <Text className="!text-[16px] !font-semibold !text-[#1e293b]">{label}</Text>
            <span className="bg-[#fff3f3] text-[#ff4f4f] text-[14px] rounded-full px-[7px] leading-[22px]">
                {index + 1}
            </span>
            {personName && (
                <Text className="!text-[14px] !text-[#6a7282] min-w-0 truncate">
                    — {personName}
                </Text>
            )}
        </div>

        {showPhoto && (
            <div>
                <PhotoUpload name={`${base}.photo`} />
                <FieldError name={`${base}.photo`} />
            </div>
        )}

        <Row gutter={[16, 16]}>
            {personDocFields(base, nationality, hasDin, entityType).map(doc => (
                <Col xs={24} md={12} key={doc.name}>
                    <FileUploadField name={doc.name} label={doc.label} required={doc.required} />
                </Col>
            ))}
        </Row>
        <FieldError name={base} />
    </div>
);

// "Director KYC Documents" block (Figma 1819:22349) — photo + identity proofs.
// Private Limited / Partnership render one card per person from the KYC step
// (named, so the user knows exactly whose documents they are uploading); other
// entities keep the single director block.
const DirectorDocuments = () => {
    const { values } = useFormikContext<Record<string, unknown>>();
    const group = getDocPeopleGroup(values);

    if (!group) {
        const director = values.director as DocPerson | undefined;
        return (
            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2">
                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">
                        {singlePersonLabel(values)}
                    </Text>
                    <span className="bg-[#fff3f3] text-[#ff4f4f] text-[14px] rounded-full px-[7px] leading-[22px]">
                        1
                    </span>
                </div>
                <div>
                    <PhotoUpload name={DIRECTOR_PHOTO} />
                    <FieldError name={DIRECTOR_PHOTO} />
                </div>
                <Row gutter={[16, 16]}>
                    {personDocFields(
                        'documents.director',
                        director?.nationality,
                        Boolean(director?.din),
                        values.entityType as EntityType | undefined
                    ).map(doc => (
                        <Col xs={24} md={12} key={doc.name}>
                            <FileUploadField
                                name={doc.name}
                                label={doc.label}
                                required={doc.required}
                            />
                        </Col>
                    ))}
                </Row>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {group.people.map((person, i) => (
                <PersonDocsCard
                    key={i}
                    label={group.label}
                    index={i}
                    base={`documents.${group.field}.${i}`}
                    personName={personDisplayName(person) || undefined}
                    nationality={person?.nationality}
                    hasDin={Boolean(person?.din)}
                    showPhoto={!isPartnerEntity(values.entityType as EntityType | undefined)}
                    entityType={values.entityType as EntityType | undefined}
                />
            ))}
        </div>
    );
};

export default DirectorDocuments;
