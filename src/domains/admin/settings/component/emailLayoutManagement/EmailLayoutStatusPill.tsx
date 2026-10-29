import { EmailLayoutStatus } from '../../types/emailLayout';

const STATUS_TONE: Record<
    EmailLayoutStatus,
    { textClass: string; bgClass: string; dotClass: string; label: string }
> = {
    PUBLISHED: {
        textClass: 'text-textDarkGreen',
        bgClass: 'bg-bgLightGreen',
        dotClass: 'bg-textDarkGreen',
        label: 'Published',
    },
    DRAFT: {
        textClass: 'text-textOrange',
        bgClass: 'bg-bgOrangeYellow',
        dotClass: 'bg-textOrange',
        label: 'Draft',
    },
};

type EmailLayoutStatusPillProps = {
    status: EmailLayoutStatus;
};

const EmailLayoutStatusPill = ({ status }: EmailLayoutStatusPillProps) => {
    const tone = STATUS_TONE[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full px-3 py-0.5 text-xs ${tone.textClass} ${tone.bgClass}`}
        >
            <span className={`inline-block w-2 h-2 rounded-full ${tone.dotClass}`} />
            {tone.label}
        </span>
    );
};

export default EmailLayoutStatusPill;
