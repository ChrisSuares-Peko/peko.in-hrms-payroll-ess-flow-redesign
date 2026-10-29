import { Modal, Typography } from 'antd';

import { COUNTRIES } from '../../utils/countries';
import {
    GENDER_OPTIONS,
    NATIONALITY_OPTIONS,
    OCCUPATION_OPTIONS,
    PROMOTER_TYPE_OPTIONS,
    QUALIFICATION_OPTIONS,
    SALUTATION_OPTIONS,
} from '../../utils/proprietorKyc';

const { Text } = Typography;

interface Address {
    line1?: string;
    line2?: string;
    area?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
}

export interface ViewablePerson {
    nationality?: string;
    residency?: string;
    pan?: string;
    passportNumber?: string;
    citizenship?: string;
    promoterType?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    salutation?: string;
    fathersName?: string;
    dob?: string;
    gender?: string;
    birthPlace?: string;
    birthDistrict?: string;
    qualification?: string;
    occupation?: string;
    din?: string;
    email?: string;
    isdCode?: string;
    mobile?: string;
    address?: Address;
}

type Option = { label: string; value: string };
const optLabel = (options: Option[], value?: string) =>
    (value && options.find(o => o.value === value)?.label) || value || '—';
const countryLabel = (value?: string) =>
    (value && COUNTRIES.find(c => c.value === value)?.label) || value || '—';

interface PersonViewModalProps {
    open: boolean;
    person?: ViewablePerson;
    title: string;
    onClose: () => void;
}

// Read-only view of a person's captured KYC details (Figma — "View" action on the
// shareholding table). Purely informational; editing directors happens on the
// KYC step and shareholders via the Add Shareholder modal.
const PersonViewModal = ({ open, person, title, onClose }: PersonViewModalProps) => {
    const p = person || {};
    const foreign = p.nationality === 'foreign';
    const addr = p.address || {};
    const rows: [string, string][] = [
        ['Role', optLabel(PROMOTER_TYPE_OPTIONS, p.promoterType)],
        ['Nationality', optLabel(NATIONALITY_OPTIONS, p.nationality)],
        foreign ? ['Passport number', p.passportNumber || '—'] : ['PAN', p.pan || '—'],
        ...(foreign ? ([['Citizenship', countryLabel(p.citizenship)]] as [string, string][]) : []),
        ['Full name', [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') || '—'],
        ["Father's name", p.fathersName || '—'],
        ['Date of birth', String(p.dob ?? '').slice(0, 10) || '—'],
        ['Gender', optLabel(GENDER_OPTIONS, p.gender)],
        ['Salutation', optLabel(SALUTATION_OPTIONS, p.salutation)],
        ['Birth place', [p.birthPlace, p.birthDistrict].filter(Boolean).join(', ') || '—'],
        ['Qualification', optLabel(QUALIFICATION_OPTIONS, p.qualification)],
        ['Occupation', optLabel(OCCUPATION_OPTIONS, p.occupation)],
        ...(p.din ? ([['DIN', p.din]] as [string, string][]) : []),
        ['Email', p.email || '—'],
        ['Mobile', p.mobile ? `+${p.isdCode || '91'} ${p.mobile}` : '—'],
        ['Country of residence', countryLabel(p.residency)],
        [
            'Address',
            [addr.line1, addr.line2, addr.area, addr.city, addr.district, addr.state, addr.pincode]
                .filter(Boolean)
                .join(', ') || '—',
        ],
    ];

    return (
        <Modal open={open} onCancel={onClose} footer={null} title={title} width={620}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-2">
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <Text className="!block !text-[12px] !text-[#94a3b8]">{label}</Text>
                        <Text className="!text-[14px] !text-[#1e293b] !font-medium break-words">{value}</Text>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default PersonViewModal;
