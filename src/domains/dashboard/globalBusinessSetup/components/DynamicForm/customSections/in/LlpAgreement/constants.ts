export type Choice = { key: string; label: string; default: boolean };

export const PARTNER_RIGHTS: Choice[] = [
    {
        key: 'access_books',
        label: 'Access books of account and records at any reasonable time',
        default: true,
    },
    {
        key: 'receive_profits',
        label: 'Receive their share of profits as per the agreement',
        default: true,
    },
    {
        key: 'participate_meetings',
        label: 'Participate in meetings and vote on resolutions',
        default: false,
    },
    {
        key: 'indemnified',
        label: 'Be indemnified by the LLP for acts done in good faith',
        default: true,
    },
    {
        key: 'separate_business',
        label: 'Carry on separate business with prior intimation to LLP',
        default: false,
    },
];

export const PARTNER_DUTIES: Choice[] = [
    {
        key: 'account_benefit',
        label: 'Account to the LLP for any benefit derived without consent',
        default: true,
    },
    {
        key: 'indemnify_fraud',
        label: 'Indemnify the LLP for any loss caused by fraud',
        default: true,
    },
    {
        key: 'render_accounts',
        label: 'Render true accounts and full information affecting the LLP',
        default: false,
    },
    {
        key: 'best_interests',
        label: 'Act in the best interests of the LLP at all times',
        default: true,
    },
    {
        key: 'not_compete',
        label: 'Not engage in competing business without written consent',
        default: false,
    },
    {
        key: 'confidentiality',
        label: 'Maintain strict confidentiality of LLP information',
        default: true,
    },
];

export const QUORUM_OPTIONS = [
    { label: '1 Partner', value: '1' },
    { label: '2 Partners', value: '2' },
    { label: 'Majority of Partners', value: 'majority' },
    { label: 'All Partners', value: 'all' },
];

export const VOTING_OPTIONS = [
    { label: 'Simple Majority (>50%)', value: 'simple_majority' },
    { label: 'Three-Fourths Majority (75%)', value: 'three_fourths' },
    { label: 'Unanimous (100%)', value: 'unanimous' },
];

export const DISPUTE_OPTIONS = [
    { label: 'Arbitration (Recommended)', value: 'arbitration' },
    { label: 'Mediation', value: 'mediation' },
    { label: 'Mutual Negotiation', value: 'negotiation' },
    { label: 'Courts of Jurisdiction', value: 'courts' },
];

const DOC_CHOICE_OPTIONS = [
    { label: 'Standard', value: 'standard' },
    { label: 'Custom', value: 'custom' },
];

const labelFor = (options: { label: string; value: string }[], value: string) =>
    options.find(o => o.value === value)?.label ?? value;

export const quorumLabel = (value: string) => labelFor(QUORUM_OPTIONS, value);
export const votingLabel = (value: string) => labelFor(VOTING_OPTIONS, value);
export const disputeLabel = (value: string) => labelFor(DISPUTE_OPTIONS, value);

type ComponentFieldSpec = {
    name: string;
    label: string;
    type: string;
    default_value?: string;
    options?: { label: string; value: string }[];
    required?: boolean;
    hidden?: boolean;
    conditional?: { field: string; operator: string; value: string };
};

// Data fields the LLP Agreement component manages. Control fields are hidden from
// the final preview; the document files are visible (the deliverables).
export const LLP_FIELD_SPECS: ComponentFieldSpec[] = [
    {
        name: 'llp_type',
        label: 'LLP Agreement Type',
        type: 'radio',
        default_value: 'standard',
        options: DOC_CHOICE_OPTIONS,
        required: true,
        hidden: true,
    },
    {
        name: 'total_capital',
        label: 'Total Capital Contribution',
        type: 'number',
        default_value: '100000',
        required: true,
        hidden: true,
    },
    ...PARTNER_RIGHTS.map(
        (r): ComponentFieldSpec => ({
            name: `right_${r.key}`,
            label: r.label,
            type: 'checkbox',
            default_value: r.default ? 'true' : 'false',
            hidden: true,
        })
    ),
    ...PARTNER_DUTIES.map(
        (d): ComponentFieldSpec => ({
            name: `duty_${d.key}`,
            label: d.label,
            type: 'checkbox',
            default_value: d.default ? 'true' : 'false',
            hidden: true,
        })
    ),
    {
        name: 'meeting_quorum',
        label: 'Meeting Quorum',
        type: 'radio',
        default_value: '2',
        options: QUORUM_OPTIONS,
        required: true,
        hidden: true,
    },
    {
        name: 'voting_threshold',
        label: 'Voting Threshold for Decisions',
        type: 'radio',
        default_value: 'simple_majority',
        options: VOTING_OPTIONS,
        required: true,
        hidden: true,
    },
    {
        name: 'dispute_method',
        label: 'Dispute Resolution Method',
        type: 'radio',
        default_value: 'arbitration',
        options: DISPUTE_OPTIONS,
        required: true,
        hidden: true,
    },
    {
        name: 'jurisdiction',
        label: 'Jurisdiction',
        type: 'text',
        required: true,
        hidden: true,
        conditional: { field: 'llp_type', operator: 'equals', value: 'standard' },
    },
    {
        name: 'custom_llp_file',
        label: 'Custom LLP Agreement',
        type: 'file',
        required: true,
        conditional: { field: 'llp_type', operator: 'equals', value: 'custom' },
    },
    {
        name: 'generated_llp_file',
        label: 'Generated LLP Agreement (PDF)',
        type: 'file',
        conditional: { field: 'llp_type', operator: 'equals', value: 'standard' },
    },
    {
        name: 'confirmed',
        label: 'LLP Agreement confirmation',
        type: 'checkbox',
        default_value: 'false',
        required: true,
        hidden: true,
    },
];
