import { useState } from 'react';

import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import RequestProfileUpdateModal from './RequestProfileUpdateModal';
import { EmployeeProfile } from '../../api/onboarding';

const { Text } = Typography;

const FALLBACK = '—';

const Field = ({ label, value }: { label: string; value?: string }) => (
    <Flex vertical gap={2}>
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="text-sm font-medium text-black">{value || FALLBACK}</Text>
    </Flex>
);

const buildAddress = (personal?: EmployeeProfile['personalInformation']) => {
    if (!personal) return '';
    const parts = [
        personal.addressLine1,
        personal.addressLine2,
        personal.state,
        personal.country,
        personal.pinCode,
    ].filter(Boolean);
    return parts.join(', ');
};

interface PersonalInfoTabProps {
    profile: EmployeeProfile | null;
    onRequestSubmitted?: () => void;
}

const PersonalInfoTab = ({ profile, onRequestSubmitted }: PersonalInfoTabProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const personal = profile?.personalInformation;
    const workEmail = profile?.employeeInformation?.workEmailId;
    const requestPending = !!profile?.profileUpdateRequestPending;

    return (
        <div className="bg-white rounded-3xl shadow-[0px_1.66px_16.56px_1.52px_rgba(0,0,0,0.06)] px-8 py-8">
            <Flex justify="space-between" align="center" className="mb-5">
                <Text className="text-xl font-semibold text-black">Personal Info</Text>
                <Button
                    danger={!requestPending}
                    disabled={requestPending}
                    size="large"
                    className="rounded-lg text-[12px] w-[150px] h-[41.5px] whitespace-nowrap"
                    onClick={() => setModalOpen(true)}
                >
                    {requestPending ? 'Request sent to HR' : 'Request Profile Update'}
                </Button>
            </Flex>

            {requestPending && (
                <Flex
                    align="center"
                    gap={8}
                    className="px-4 py-3 rounded-xl mb-5"
                    style={{ backgroundColor: '#FFF7E6', border: '0.5px solid #FFE7BA' }}
                >
                    <ClockCircleOutlined style={{ color: '#B26A00' }} />
                    <Text className="text-xs font-medium" style={{ color: '#B26A00' }}>
                        Your profile update request is under HR review and will be reflected after
                        approval.
                    </Text>
                </Flex>
            )}

            <div className="rounded-[20px] border-[0.5px] border-[#cccccc]/80 p-[30px]">
                <Text className="text-[12px] font-medium text-gray-400 uppercase">
                    Contact Information
                </Text>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mt-4">
                    <Field label="Mobile Number" value={personal?.mobileNo} />
                    <Field label="Personal Email" value={personal?.email} />
                    <Field label="Work Email" value={workEmail} />
                    <Field label="Residential Address" value={buildAddress(personal)} />
                </div>

                <div className="border-t border-[#f0f0f0] my-6" />

                <Text className="text-xs font-medium text-gray-400 uppercase">
                    Emergency Contact
                </Text>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mt-4">
                    <Field label="Emergency Contact Name" value={personal?.emergencyContactName} />
                    <Field label="Emergency Contact Phone" value={personal?.emergencyContactNo} />
                    <Field
                        label="Emergency Contact Relation"
                        value={personal?.emergencyContactRelation}
                    />
                </div>
            </div>

            <RequestProfileUpdateModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                profile={profile}
                onSuccess={onRequestSubmitted}
            />
        </div>
    );
};

export default PersonalInfoTab;
