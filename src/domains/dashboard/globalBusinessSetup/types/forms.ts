import { Country } from './globalBusinessSetup';
import { PricingType, QuoteConfig } from './pricing';

interface BaseDocument {
    _id: string;
    // Stable authoring reference id the backend assigns to every form node
    // (page/section/field). Pricing V2 `form_binding`s prefer matching on this.
    ref_id?: string;
    created_at?: Date;
    updated_at?: Date;
}

export type FieldType =
    | 'text'
    | 'textarea'
    | 'email'
    | 'number'
    | 'currency'
    | 'date'
    | 'radio'
    | 'checkbox'
    | 'checkbox_group'
    | 'select'
    | 'file'
    | 'image'
    | 'phone'
    | 'country'
    | 'table'
    | 'nested_select';

export interface INestedLevel {
    column: string;
    label: string;
}

export type ConditionalOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'in'
    | 'not_in';

// Operators for field-vs-field comparisons and section count/sum rules. Adds the
// inclusive (`_equals`) numeric variants the conditional operator set lacks.
export type ComparisonOperator =
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'greater_than_equals'
    | 'less_than_equals';

export type ValueMatchOperator = 'equals' | 'not_equals' | 'in' | 'not_in';

// A cross-field validation rule attached to a field: compares this field's value
// against another field's live value (resolved by `target_field_name`).
export interface IFieldComparison {
    id?: string;
    enabled?: boolean;
    operator: ComparisonOperator;
    target_field_id?: string;
    target_field_name?: string;
    error_message: string;
}

export enum RepeaterSourceType {
    FIELD_VALUE = 'field_value',
    FIXED_COUNT = 'fixed_count',
    USER_CONTROLLED = 'user_controlled',
}

export enum FileType {
    IMAGE = 'image',
    DOCUMENT = 'document',
}

export interface IFieldOption {
    label: string;
    value: string;
}

export interface IFieldValidation {
    required: { value: boolean; error_message: string };
    unique?: { value: boolean; error_message: string };
    min?: {
        value?: number;
        error_message?: string;
    };
    max?: {
        value?: number;
        error_message?: string;
    };
    regex?: {
        value?: string;
        error_message?: string;
    };
    min_length?: {
        value?: number;
        error_message?: string;
    };
    max_length?: {
        value?: number;
        error_message?: string;
    };
    file_types?: {
        value?: FileType[];
        error_message?: string;
    };
    max_file_size?: {
        value?: number; // in MB
        error_message?: string;
    };
    future_dates_only?: {
        value?: boolean;
        error_message?: string;
    };
    past_dates_only?: {
        value?: boolean;
        error_message?: string;
    };
    min_years_offset?: {
        value: number;
    };
    items?: {
        from_field?: boolean;
        section?: string;
        source_field_name?: string;
        error_message?: string;
    };
}

export interface IConditional {
    enabled: boolean;
    source_field_name?: string;
    operator?: ConditionalOperator;
    value?: any;
}

export interface IField extends BaseDocument {
    allow_multiple: boolean;
    label: string;
    name: string;
    placeholder: string;
    default_value: string;
    description: string;
    type: FieldType;
    currency?: string;
    options_source_type: string;
    options_source_field_name: string;
    options: IFieldOption[];
    validation: IFieldValidation;
    order: number;
    conditional: IConditional;
    comparisons?: IFieldComparison[];
    table?: string;
    view?: { is_hidden?: boolean };
    levels?: INestedLevel[];
}

export interface IRepeater {
    enabled: boolean;
    source_type?: RepeaterSourceType;
    source_field_name?: string;
    min_instances?: number;
    max_instances?: number;
    fixed_count?: number;
    title_template?: string;
    // Optional link to a field in a sibling repeater (driven by the same
    // source field): that field's per-instance value is appended to this
    // section's instance titles, e.g. "Director 2 - John".
    label_field_name?: string;
    label_field_id?: string;
}

export interface ISectionDocument {
    _id: string;
    name: string;
    url: string;
    size: number;
    extension: string;
    description: Date;
}
export interface ISectionDocuments {
    enabled: boolean;
    title: string;
    description?: string;
    files: ISectionDocument[];
}

export interface ISectionValidationRule {
    type: 'sum' | 'count' | 'custom' | string;
    source_field_name: string;
    source_field_id?: string;
    // `sum`: compares the summed field total against `value`.
    // `count`: compares the number of matching instances against `value`.
    operator: string;
    value: number | string;
    // `count` only: the per-instance match predicate.
    match_operator?: ValueMatchOperator;
    match_value?: string;
    error_message?: string;
    _id?: string;
}

export interface ISectionValidation {
    rules: ISectionValidationRule[];
}

export interface ISection extends BaseDocument {
    title: string;
    description?: string;
    order: number;
    fields: IField[];
    repeater: IRepeater;
    conditional: IConditional;
    documents?: ISectionDocuments;
    validation?: ISectionValidation;
    section_type?: 'standard' | 'custom';
    component_key?: string;
    component_config?: Record<string, unknown>;
    compliance?: { enabled: boolean };
    aml_checks?: { key: string }[];
}

export interface IPage extends BaseDocument {
    title: string;
    description?: string;
    order: number;
    sections: ISection[];
}

export interface IForm extends BaseDocument {
    credential: string;
    country: string;
    company_type: string;
    freezone: string;
    title: string;
    description?: string;
    pages: IPage[];
    status: 'draft' | 'published' | 'archived' | 'deleted' | 'outdated';
    reason?: string;
    amount: number;
    version: number;
}

// Extended interfaces for populated documents
export interface IFieldPopulated extends Omit<IField, 'fields'> {
    // Field doesn't have nested references
}

export interface ISectionPopulated extends Omit<ISection, 'fields'> {
    fields: IFieldPopulated[];
}

export interface IPagePopulated extends Omit<IPage, 'sections'> {
    sections: ISectionPopulated[];
}

export interface IFormPopulated extends Omit<IForm, 'pages' | 'country'> {
    pages: IPagePopulated[];
    country: Country;
}

// Section Instance Interface (for repeater functionality)
export interface ISectionInstance extends ISectionPopulated {
    _instance_id: string;
    _instance_index: number;
    _instance_count: number;
    _is_repeater_instance: boolean;
    _can_delete: boolean;
    _can_add: boolean;
}

// Form Data Interfaces
export interface IFormData {
    [fieldName: string]: any;
}

export interface IFormSubmission {
    form_id: string;
    form_data: IFormData;
    submitted_at: Date;
    user_id?: string;
    session_id?: string;
    ip_address?: string;
    user_agent?: string;
}

// Validation Result Interfaces
export interface IValidationError {
    field_name: string;
    message: string;
    value?: any;
}

export interface IValidationResult {
    is_valid: boolean;
    errors: IValidationError[];
}

// Method return types
export interface IStackedSections {
    [key: number]: ISectionPopulated[];
}

// Utility types
export type FieldValue = string | number | boolean | string[] | File | File[];

export type FormDataFlat = Record<string, FieldValue>;

export type ConditionalValue = string | number | boolean | string[] | number[];

// Configuration types for different source types
export interface IFieldValueRepeater extends IRepeater {
    source_type: RepeaterSourceType.FIELD_VALUE;
    source_field_name: string;
}

export interface IFixedCountRepeater extends IRepeater {
    source_type: RepeaterSourceType.FIXED_COUNT;
    fixed_count: number;
}

export interface IUserControlledRepeater extends IRepeater {
    source_type: RepeaterSourceType.USER_CONTROLLED;
    min_instances: number;
    max_instances: number;
}

// Union type for different repeater configurations
export type RepeaterConfig = IFieldValueRepeater | IFixedCountRepeater | IUserControlledRepeater;

// Form builder configuration interfaces
export interface IFormBuilderConfig {
    allow_conditional_fields: boolean;
    allow_field_validation: boolean;
    allow_section_repeaters: boolean;
    max_pages_per_form: number;
    max_sections_per_page: number;
    max_fields_per_section: number;
    supported_field_types: FieldType[];
}

export interface FormData {
    _id: string;
    form: string;
    pages: Page[];
    created_at?: string;
    updated_at?: string;
}

export interface Page {
    page: string;
    sections: Section[];
}

export interface Section {
    section: string;
    instances: Instance[];
}

export interface Instance {
    id: string;
    fields: Field[];
}

export interface Field {
    field: string;
    name: string;
    value: string;
}

// Streaming submit-progress event (vendor's company_submit_update shape).
// Parent stages: validating / processing / saving / compliance (+ terminal
// variants); sub-item stages: validating_item / processing_item /
// saving_item / compliance_check.
export interface SubmitUpdate {
    stage: string;
    status: string;
    message?: string;
    key?: string;
    reference_id?: string;
    // validating_item
    field_label?: string;
    section_title?: string;
    // processing_item
    filename?: string;
    size_mb?: number;
    // saving_item
    label?: string;
    // compliance_check
    entity_name?: string;
    match_count?: number;
    matched_names?: string[];
    // final saving summary
    proposed_name?: string;
    client_name?: string;
    tracking_id?: string;
    application_id?: number | string;
    file_count?: number;
}

export type SubmissionMeta = {
    status: 'saved' | 'draft';
    reference_id?: string;

    metrics: {
        visa: number;
        activity: number;
        shareholder: number;
    } | null;

    pricingId?: string;
    quoteConfig?: QuoteConfig | null;
    countryData: {
        country: string;
        freezone: string;
        type: string;
    };
};

export interface SubmittedCountry {
    _id: string;
    name: string;
    logo: string;
}

export interface SubmittedAgent {
    _id: string;
    name: string;
}

export interface SubmittedProvider {
    _id: string;
    title: string;
    logo: string;
}

export interface SubmittedMetrics {
    visa: number;
    activity: number;
    shareholder: number;
}

export interface SubmittedField {
    // Required: vendor's API always carries these on each saved field record
    field: string;
    value?: any;
    _id?: string;
    // Optional / legacy: not in current vendor payload shape; populated only
    // by older or transformed responses. Consumers should derive type/labels
    // from the schema (`IField`), not from these.
    label?: string;
    name?: string;
    type?: FieldType | 'country';
    option_label?: string | string[];
}

export interface SubmittedInstance {
    fields: SubmittedField[];
}

export interface SubmittedSection {
    section: string;
    title: string;
    instances: SubmittedInstance[];
}

export interface SubmittedPage {
    page: string;
    title: string;
    description: string;
    sections: SubmittedSection[];
}

export interface SubmittedFormData {
    form: string;
    pages: SubmittedPage[];
}

export interface ConsentDocusign {
    envelope_id?: string;
    status?: 'sent' | 'delivered' | 'completed' | 'declined' | 'voided';
    signed_pdf_url?: string;
    certificate_url?: string;
}

export interface ApplicationConsent {
    status?: 'none' | 'pending' | 'received' | 'rejected';
    config?: string;
    rejection_reason?: string;
    docusign?: ConsentDocusign;
}

export type ComplianceEntityState = 'done' | 'flag' | 'block' | 'skipped' | 'error';

export interface ComplianceEntity {
    name: string;
    state: ComplianceEntityState;
    section_id?: string;
    field_id?: string;
    instance_index?: number;
    check_id?: string;
    match_count?: number;
}

export interface ComplianceCheck {
    key: string;
    state: ComplianceEntityState;
    detail: string;
    entities?: ComplianceEntity[];
}

export interface ApplicationCompliance {
    status: 'skipped' | 'passed' | 'flagged' | 'blocked' | 'error';
    ran_at?: string;
    checks: ComplianceCheck[];
}

export interface SubmittedApplication extends BaseDocument {
    country: SubmittedCountry;
    agent: SubmittedAgent;
    reference_id: string;
    proposed_name: string;
    type: string; // e.g. 'mainland'
    freezone: string;
    status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | string;
    is_paid: boolean;
    provider: SubmittedProvider;
    pricing?: PricingType | null;
    metrics?: SubmittedMetrics;
    quote_config?: QuoteConfig;
    form_data: SubmittedFormData;
    is_active: boolean;
    tracking_id: string;
    application_id?: string;
    consent_required?: boolean;
    client_name?: string;
    client_email?: string;
    consent?: ApplicationConsent;
    compliance?: ApplicationCompliance;
}

export type FieldTypes = {
    field: string;
    label: string;
    name: string;
    value: any;
    type: string;
    option_label?: string | string[];
};
