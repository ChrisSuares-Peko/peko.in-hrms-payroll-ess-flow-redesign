import { ReactSVG } from 'react-svg';

import iconStepDocs from '../assets/icons/icon-step-docs.svg';
import iconStepInfo from '../assets/icons/icon-step-info.svg';
import iconStepOverview from '../assets/icons/icon-step-overview.svg';

export const STATUS_LABEL: Record<string, { text: string; color: string }> = {
    overdue: { text: 'Overdue', color: '#ef4444' },
    upcoming: { text: 'Due soon', color: '#f59e0b' },
    completed: { text: 'Completed', color: '#22c55e' },
    processing: { text: 'In Progress', color: '#3b82f6' },
};

const prepareSvg = (svg: SVGElement) => {
    svg.querySelectorAll('rect').forEach((rect) => rect.remove());
    svg.querySelectorAll('path').forEach((path) => {
        path.setAttribute('stroke-width', '1.5');
    });
};

const stepIconProps = (src: string) => ({
    src,
    wrapper: 'span' as const,
    className: 'flex items-center justify-center [&_svg]:size-5 [&_svg]:shrink-0 [&_path]:stroke-current',
    beforeInjection: prepareSvg,
});

export const STEP_ICONS = {
    overview: <ReactSVG {...stepIconProps(iconStepOverview)} />,
    info: <ReactSVG {...stepIconProps(iconStepInfo)} />,
    docs: <ReactSVG {...stepIconProps(iconStepDocs)} />,
};

export const steps = [
    { key: 'overview', label: 'Overview', icon: STEP_ICONS.overview },
    { key: 'info', label: 'Information required', icon: STEP_ICONS.info },
    { key: 'docs', label: 'Documents', icon: STEP_ICONS.docs },
];

export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type AllowedDocType = (typeof ALLOWED_DOC_TYPES)[number];
