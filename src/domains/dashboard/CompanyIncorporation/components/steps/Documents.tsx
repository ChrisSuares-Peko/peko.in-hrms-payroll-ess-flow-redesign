import { CloseCircleOutlined, FileOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Progress, Row, Typography, Upload } from 'antd';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { ApplicationPayload, EntityType } from '../../types';

const { Title, Paragraph, Text } = Typography;

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const Documents = () => {
    const dispatch = useAppDispatch();
    const { values, setFieldValue, errors } = useFormikContext<ApplicationPayload>();
    const directors = values.directors || [];
    const isLLP = values.entityType === EntityType.LLP;
    const personLabel = isLLP ? 'Partner' : 'Director';

    const hasRegisteredOffice = values.registeredOffice?.availability === 'have';
    const officeType = values.registeredOffice?.officeType ?? '';
    const isOwned = officeType === 'owned';

    let officeDocFields: string[] = [];
    if (hasRegisteredOffice) {
        officeDocFields = isOwned
            ? ['nocFromOwner', 'titleOrUtilityDoc']
            : ['nocFromOwner', 'utilityBill', 'rentOrLeaseDeed'];
    }

    const documentFields = [
        ...officeDocFields,
        ...directors.flatMap((director, i) => [
            `director_${i}_photo`,
            ...(director.nationality === 'Indian'
                ? [`director_${i}_proofOfIdentity`, `director_${i}_proofOfAddress`]
                : [`director_${i}_passport`]),
        ]),
        'nameAvailabilityCertificate',
        'trademarkCertificate',
    ];

    const totalDocuments = documentFields.length || 16;
    const uploadedCount = documentFields.filter(f => {
        const val = (values as unknown as Record<string, unknown>)[f];
        return val && typeof val === 'object' && 'fileName' in (val as object);
    }).length;
    const progressPercent = totalDocuments > 0 ? (uploadedCount / totalDocuments) * 100 : 0;

    const toDocType = (fieldName: string): string =>
        fieldName.replace(/([A-Z])/g, m => `_${m.toLowerCase()}`);

    const readFileAsBase64 = (file: File, fieldName: string) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFieldValue(fieldName, {
                docType: toDocType(fieldName),
                fileName: file.name,
                fileBase64: reader.result as string,
                mimeType: file.type,
            });
        };
        reader.readAsDataURL(file);
    };

    const makeBeforeUpload =
        (fieldName: string) =>
        (file: File): boolean => {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                dispatch(
                    showToast({
                        description: `File size must be smaller than ${MAX_FILE_SIZE_MB} MB`,
                        variant: 'error',
                    })
                );
                return false;
            }
            readFileAsBase64(file, fieldName);
            return false;
        };

    const handleRemoveFile = (fieldName: string) => {
        setFieldValue(fieldName, undefined);
    };

    const getFile = (fieldName: string) => {
        const val = (values as unknown as Record<string, unknown>)[fieldName];
        if (val && typeof val === 'object' && 'fileName' in (val as object)) {
            return val as { fileName: string; docType: string; fileBase64: string; mimeType: string };
        }
        return null;
    };

    const getError = (fieldName: string): string | null => {
        const err = (errors as Record<string, unknown>)[fieldName];
        return err ? String(err) : null;
    };

    const renderFileUpload = (fieldName: string) => {
        const file = getFile(fieldName);
        const error = getError(fieldName);

        if (file) {
            return (
                <Flex
                    align="center"
                    gap={12}
                    className="border border-borderSlateMuted rounded-[10px] h-[51px] px-4 bg-white"
                >
                    <FileOutlined className="text-lightRed text-[18px] shrink-0" />
                    <div className="flex-1 min-w-0">
                        <Text className="text-[14px] font-medium text-[#292d32] truncate block">
                            {file.fileName}
                        </Text>
                        <div className="h-[2px] bg-lightRed mt-1 rounded-full" />
                    </div>
                    <Button
                        type="text"
                        icon={<CloseCircleOutlined className="text-[16px]" />}
                        onClick={() => handleRemoveFile(fieldName)}
                        className="!text-lightRed hover:!bg-bgRedLight !p-0 !h-auto shrink-0 ml-1 transition-colors"
                    />
                </Flex>
            );
        }

        return (
            <div className="space-y-1">
                <Flex
                    align="center"
                    justify="space-between"
                    className="border border-dashed border-borderSlateMuted rounded-[10px] h-[51px] px-4 bg-white"
                >
                    <Text className="text-[12px] sm:text-[13px] md:text-[14px] text-textGreyColor min-w-0 flex-1 mr-2 truncate">
                        Upload PDF, JPG, JPEG, PNG File (Max 5 MB)
                    </Text>
                    <div className="flex-shrink-0">
                        <Upload
                            accept=".pdf,.jpg,.png"
                            showUploadList={false}
                            beforeUpload={makeBeforeUpload(fieldName)}
                        >
                            <Button
                                size="small"
                                className="!border-borderSlateMuted !text-[12px] sm:!text-[14px] !font-medium !text-[#54575c] hover:!bg-gray-50 !rounded-[7px] transition-colors"
                            >
                                Browse File
                            </Button>
                        </Upload>
                    </div>
                </Flex>
                {error && <Text data-form-error="true" className="text-lightRed text-[12px] block">{error}</Text>}
            </div>
        );
    };

    const renderPhotoUpload = (fieldName: string) => {
        const file = getFile(fieldName);
        const error = getError(fieldName);

        return (
            <div className="space-y-1">
                {file ? (
                    <div className="relative w-[104px]">
                        <div className="w-[104px] h-[104px] border border-neutralGray500 rounded-[2px] overflow-hidden bg-zinc-50">
                            {file.fileBase64 && file.mimeType?.startsWith('image/') ? (
                                <img
                                    src={file.fileBase64}
                                    alt={file.fileName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Flex align="center" justify="center" className="w-full h-full">
                                    <FileOutlined className="text-lightRed text-[24px]" />
                                </Flex>
                            )}
                        </div>
                        <Button
                            type="text"
                            icon={<CloseCircleOutlined className="text-[16px]" />}
                            onClick={() => handleRemoveFile(fieldName)}
                            className="!absolute !-top-2 !-right-2 !text-lightRed hover:!bg-bgRedLight !p-0 !h-auto !min-w-0 transition-colors"
                        />
                        <Text className="text-[12px] text-[#292d32] mt-1 truncate w-[104px] block">
                            {file.fileName}
                        </Text>
                    </div>
                ) : (
                    <>
                        <Upload
                            accept=".jpg,.jpeg,.png"
                            showUploadList={false}
                            beforeUpload={makeBeforeUpload(fieldName)}
                        >
                            <Flex
                                vertical
                                align="center"
                                justify="center"
                                className="bg-zinc-50 border border-neutralGray500 rounded-[2px] w-[104px] h-[104px] cursor-pointer hover:bg-[#f0f0f0]"
                            >
                                <PlusOutlined className="text-[14px] text-[#54575c]" />
                                <Text className="text-[14px] text-[rgba(0,0,0,0.85)] mt-2">
                                    Upload
                                </Text>
                            </Flex>
                        </Upload>
                        {error && <Text data-form-error="true" className="text-lightRed text-[12px] block">{error}</Text>}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-5">
            {/* Upload Progress */}
            <div className="bg-bgGrayF9 rounded-[12px] p-4 sm:p-6 space-y-2">
                <Paragraph className="!mb-0 text-[13px] sm:text-[16px] font-semibold text-slate-500">
                    Upload Progress{' '}
                    <Text className="text-lightRed">
                        {uploadedCount} of {totalDocuments} documents uploaded
                    </Text>
                </Paragraph>
                <Progress
                    percent={progressPercent}
                    strokeColor="#ff4f4f"
                    trailColor="#e7e7e7"
                    showInfo={false}
                    strokeWidth={12}
                    className="!mb-0"
                />
            </div>

            {/* Registered Office Documents — only shown when user has a registered office */}
            {hasRegisteredOffice && (
                <div className="border border-zinc-200 rounded-[22px] p-6 space-y-8">
                    <Title level={3} className="!text-[18px] !font-medium !mb-0 !text-black">
                        Registered Office Documents
                    </Title>

                    <div className="space-y-6">
                        {isOwned ? (
                            /* Owned office — NOC + Title Document or Utility Bill */
                            <Row gutter={[24, 0]}>
                                <Col xs={24} sm={12}>
                                    <div className="space-y-4">
                                        <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                            NOC from Owner<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                                        </Paragraph>
                                        {renderFileUpload('nocFromOwner')}
                                    </div>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <div className="space-y-4">
                                        <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                            Title Document or Utility Bill (≤2 months old)<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                                        </Paragraph>
                                        {renderFileUpload('titleOrUtilityDoc')}
                                    </div>
                                </Col>
                            </Row>
                        ) : (
                            /* Rented / Shared Office — NOC + Utility Bill + Rent or Lease Deed */
                            <>
                                <Row gutter={[24, 0]}>
                                    <Col xs={24} sm={12}>
                                        <div className="space-y-4">
                                            <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                                NOC from Owner<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                                            </Paragraph>
                                            {renderFileUpload('nocFromOwner')}
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <div className="space-y-4">
                                            <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                                Utility Bill (Electricity/Water/Gas – ≤2 months old)<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                                            </Paragraph>
                                            {renderFileUpload('utilityBill')}
                                        </div>
                                    </Col>
                                </Row>
                                <Row gutter={[24, 0]}>
                                    <Col xs={24} sm={12}>
                                        <div className="space-y-4">
                                            <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                                Rent Deed or Lease Deed<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                                            </Paragraph>
                                            {renderFileUpload('rentOrLeaseDeed')}
                                        </div>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Director / Partner KYC Documents */}
            <div className="space-y-6">
                <Title level={3} className="!text-[18px] !font-semibold !mb-0 !text-black">
                    {isLLP ? 'Designated Partner KYC Documents' : 'Director KYC Documents'}
                </Title>

                {directors.length === 0 && (
                    <Paragraph className="!mb-0 text-[14px] text-textGreyColor">
                        {isLLP
                            ? 'No partners added yet. Please complete the Designated Partners step first.'
                            : 'No directors added yet. Please complete the Directors step first.'}
                    </Paragraph>
                )}

                {directors.map((director, dirIndex) => (
                    <div
                        key={dirIndex}
                        className="border border-zinc-200 rounded-[22px] p-6 space-y-6"
                    >
                        <Title level={4} className="!text-[16px] !font-semibold !mb-0 !text-black">
                            {personLabel} {dirIndex + 1}
                            {director.name ? ` – ${director.name}` : ''}
                        </Title>

                        <div className="space-y-2">
                            <Paragraph className="!mb-0 text-[14px] text-textNearBlack">
                                Photo<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                            </Paragraph>
                            {renderPhotoUpload(`director_${dirIndex}_photo`)}
                        </div>

                        <Row gutter={[24, 0]}>
                            {director.nationality === 'Indian' ? (
                                <>
                                    <Col xs={24} sm={12}>
                                        <div className="space-y-4">
                                            <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                                Proof of Identity{' '}
                                                <Text className="text-slate-500">
                                                    (Passport / Driving License / Election ID)
                                                </Text>{' '}
                                               <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                                            </Paragraph>
                                            {renderFileUpload(`director_${dirIndex}_proofOfIdentity`)}
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <div className="space-y-4">
                                            <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                                Proof of Address{' '}
                                                <Text className="text-slate-500">
                                                    (Bank Statement / Utility Bill ≤2 months old)
                                                </Text>{' '}
                                               <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                                            </Paragraph>
                                            {renderFileUpload(`director_${dirIndex}_proofOfAddress`)}
                                        </div>
                                    </Col>
                                </>
                            ) : (
                                <Col xs={24} sm={12}>
                                    <div className="space-y-4">
                                        <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                            Passport<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                                        </Paragraph>
                                        {renderFileUpload(`director_${dirIndex}_passport`)}
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </div>
                ))}
            </div>

            {/* Name Approval / Trademark */}
            <div className="space-y-6">
                <Title level={3} className="!text-[15px] sm:!text-[18px] !font-semibold !mb-0 !text-black">
                    Name Approval / Trademark{' '}
                    <Text className="text-slate-500 font-normal text-[15px] sm:text-[18px]">(if applicable)</Text>
                </Title>

                <Row gutter={[24, 0]} align="stretch">
                    <Col xs={24} sm={12}>
                        <div className="flex flex-col gap-4 sm:justify-between sm:h-full">
                            <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                Name Availability Certificate - Any prior government approval for
                                restricted words{' '}
                                <Text className="text-slate-500">(if applicable)</Text><span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                            </Paragraph>
                            {renderFileUpload('nameAvailabilityCertificate')}
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div className="flex flex-col gap-4 sm:justify-between sm:h-full">
                            <Paragraph className="!mb-0 text-[14px] text-neutral-900">
                                Trademark Certificate{' '}
                                <Text className="text-slate-500">(if name based on TM)</Text><span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                            </Paragraph>
                            {renderFileUpload('trademarkCertificate')}
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Documents;
