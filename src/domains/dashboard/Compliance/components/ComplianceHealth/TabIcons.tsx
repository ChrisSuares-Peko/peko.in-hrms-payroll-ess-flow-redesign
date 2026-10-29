import { Image } from 'antd';
import { ReactSVG } from 'react-svg';

import iconSectionBriefcase from '../../assets/icons/icon-section-briefcase.svg';
import iconSectionBuilding from '../../assets/icons/icon-section-building.svg';
import iconSectionPercentage from '../../assets/icons/icon-section-percentage.svg';
import iconTabAllCompliance from '../../assets/icons/icon-tab-all-compliance.svg';
import iconTabOneTime from '../../assets/icons/icon-tab-one-time.svg';
import iconTabRecurring from '../../assets/icons/icon-tab-recurring.svg';

export const ACTIVE_COLOR = '#FF4F4F';
export const INACTIVE_COLOR = '#64748B';

export function AllComplianceIcon({ active }: { active: boolean }) {
    return (
        <ReactSVG
            src={iconTabAllCompliance}
            className={`-rotate-90 shrink-0 ${active ? 'svg-compliance-active' : 'svg-compliance-inactive'}`}
            beforeInjection={(svg) => {
                svg.setAttribute('width', '20');
                svg.setAttribute('height', '20');
            }}
        />
    );
}

export function OneTimeIcon({ active }: { active: boolean }) {
    return (
        <ReactSVG
            src={iconTabOneTime}
            className={`shrink-0 ${active ? 'svg-compliance-active' : 'svg-compliance-inactive'}`}
            beforeInjection={(svg) => {
                svg.setAttribute('width', '20');
                svg.setAttribute('height', '20');
            }}
        />
    );
}

export function RecurringIcon({ active }: { active: boolean }) {
    return (
        <ReactSVG
            src={iconTabRecurring}
            className={`shrink-0 ${active ? 'svg-compliance-active' : 'svg-compliance-inactive'}`}
            beforeInjection={(svg) => {
                svg.setAttribute('width', '20');
                svg.setAttribute('height', '20');
            }}
        />
    );
}

const sectionIconMap: Record<'percentage' | 'building' | 'briefcase', string> = {
    percentage: iconSectionPercentage,
    building: iconSectionBuilding,
    briefcase: iconSectionBriefcase,
};

export function SectionIcon({ type }: { type: 'percentage' | 'building' | 'briefcase' }) {
    return <Image preview={false} src={sectionIconMap[type]} alt="" width={24} height={24} />;
}
