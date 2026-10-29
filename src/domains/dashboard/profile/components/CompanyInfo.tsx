import { lazy, Suspense, useState } from 'react';

import { Flex, Typography, Button, Skeleton, Image } from 'antd';
import { useNavigate } from 'react-router-dom';

import EmptyImage from '@assets/svg/emptyDocs.svg';
import OtpModal from '@components/molecular/modals/OtpModal';
import FieldLabelValue from '@components/molecular/Text/FieldLabelValue';
import { Scope } from '@src/enums/enums';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import CertificateCard from './CertificateCard';
import { getOtp } from '../api/general';
import useCompanyInfoApi from '../hooks/useCompanyInfoApi';

const CompanyInfoModal = lazy(() => import('./CompanyInfoModal'));

const CompanyInfo = () => {
    const [openCompanyInfoModal, setOpenCompanyInfoModal] = useState(false);
    const { data, isLoading } = useCompanyInfoApi({});
    const [isOpen, setIsOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [formValues, setFormValues] = useState<any>();
    const navigate = useNavigate();
    const { handleUpdateCompanyInfo, isEditLoading } = useCompanyInfoApi({
        handleCancel: () => setIsOpen(false),
        handleOtpClose: () => setIsOpen(false),
    });
    const { id, role } = useAppSelector(state => state.reducer.auth);

    const handleDeleteDocs = async (value: string): Promise<void> => {
        const body: { [key: string]: null } = {};
        body[value] = null;
        setFormValues(body);
        const resp = await getOtp({
            userId: id,
            userType: role,
        });
        if (resp) {
            setIsOpen(true);
        }
    };

    return (
        <>
            <Flex className="w-full " justify="space-between" align="center">
                <Typography.Title level={5}>Company Information</Typography.Title>
                <Flex gap={10}>
                    <Button
                        type="primary"
                        danger
                        className="bg-bgOrange2 "
                        size="small"
                        onClick={() => navigate(paths.profile.kyb)}
                    >
                        One KYB
                    </Button>
                    <Button danger size="small" onClick={() => setOpenCompanyInfoModal(true)}>
                        Edit Info
                    </Button>
                </Flex>
            </Flex>
            <Skeleton loading={isLoading} active>
                <Flex vertical gap={16} className="mt-6">
                    <FieldLabelValue label="Activity" value={data?.activity} />
                    <FieldLabelValue
                        label="Corporate Identification Number (CIN)"
                        verified={!!data?.cinVerified}
                        value={data?.cinNumber}
                    />

                    <FieldLabelValue
                        label="GSTIN"
                        value={data?.gstNumber}
                        verified={!!data?.gstVerified}
                    />

                    <FieldLabelValue
                        label="PAN"
                        value={data?.panNumber}
                        verified={!!data?.panVerified}
                    />
                </Flex>
                <Flex vertical gap={16} className="mt-8 min-h-[30%]">
                    {data?.cinDoc === null && data?.panDoc === null && data?.gstDoc === null ? (
                        <Flex vertical align="center" justify="center">
                            <Image src={EmptyImage} preview={false} />
                            <Typography.Text className="py-4 text-base font-normal text-center text-gray-400 ">
                                No documents available
                            </Typography.Text>
                        </Flex>
                    ) : (
                        <>
                            {data?.cinDoc && (
                                <CertificateCard
                                    label="Corporate Identification Number Certificate"
                                    certificateName="Corporate Identification Number Certificate.png"
                                    link={data?.cinDoc}
                                    handleDeleteDocs={() => handleDeleteDocs('cinDoc')}
                                />
                            )}
                            {data?.gstDoc && (
                                <CertificateCard
                                    label="GSTIN Certificate"
                                    certificateName="GSTIN Certificate.png"
                                    link={data?.gstDoc}
                                    handleDeleteDocs={() => handleDeleteDocs('gstDoc')}
                                />
                            )}
                            {data?.panDoc && (
                                <CertificateCard
                                    label="PAN Card "
                                    certificateName="PAN Card.png"
                                    link={data?.panDoc}
                                    handleDeleteDocs={() => handleDeleteDocs('panDoc')}
                                />
                            )}
                        </>
                    )}
                </Flex>
            </Skeleton>
            <Suspense>
                <CompanyInfoModal
                    open={openCompanyInfoModal}
                    handleCancel={() => setOpenCompanyInfoModal(false)}
                />
            </Suspense>
            <OtpModal
                isOpen={isOpen}
                isLoading={isEditLoading!}
                handleCancel={() => setIsOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    const res = await getOtp({
                        userId: id,
                        userType: role,
                    });
                    if (res) setIsOtpSending(false);
                    else setIsOtpSending(false);
                }}
                handleSubmit={otp => {
                    handleUpdateCompanyInfo({
                        ...formValues!,
                        otp,
                        scope: Scope.EMAIL,
                        userId: id,
                        userType: role,
                    });
                }}
                title="Confirmation"
            />
        </>
    );
};

export default CompanyInfo;
