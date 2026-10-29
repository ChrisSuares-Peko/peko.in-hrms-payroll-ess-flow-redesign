export interface Application {
    id: number;
    serviceId: number;
    name: string;
    applicationId: string;
    status: 'Approved' | 'Under Review' | 'Action Required';
    progress: number;
    appliedOn: string;
    updatedOn: string;
    expectedCompletion: string;
}

export type ServiceTab = 'Mandatory' | 'Regulatory Dependent' | 'Good-to-have';
export type ServiceAuthority = 'All' | 'Central' | 'State';
export type ServiceCategory =
    | 'All'
    | 'Tax & Compliance'
    | 'Licenses & Permits'
    | 'Certifications'
    | 'Trade Enablement'
    | 'Pharma & Drugs'
    | 'Pesticides'
    | 'Fertilizers'
    | 'Hospital & Healthcare'
    | 'Hotels & Hospitality'
    | 'Data Security'
    | 'Financial Services'
    | 'Telecom & IT'
    | 'Education'
    | 'Transport & Logistics'
    | 'Business Recognition'
    | 'Intellectual Property';

export interface Service {
    id: number;
    name: string;
    slug: string;
    accessKey: string;
    description: string;
    category: string;
    tab: ServiceTab;
    duration: string;
    price: number;
    govtFee: number | 'Free';
}

export type FieldType = 'text' | 'select' | 'textarea' | 'date' | 'time' | 'checkbox' | 'multi-text' | 'radio';
export type StepType = 'form' | 'upload' | 'review' | 'payment';

export interface FormField {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    helperText?: string;
    required?: boolean;
    multiple?: boolean;
    options?: string[];
    rows?: number;
    maxToday?: boolean;
    minToday?: boolean;
    maxDaysFromToday?: number;
    showTime?: boolean;
    dependsOn?: { field: string; values: string[] };
    maxLength?: number;
    minLength?: number;
    convertToUppercase?: boolean;
    allowNumbersOnly?: boolean;
    minValue?: number;
    maxValue?: number;
    allowAlphabetsAndSpaceOnly?: boolean;
    readOnly?: boolean;
    defaultValue?: string;
    dynamicOptions?: { dependsOnField: string; queryParam: string; endpoint: string };
    staticEndpoint?: string;
    conditionalText?: { dependsOnField: string; triggerValue: string; textPlaceholder?: string };
    dependentOptions?: { dependsOnField: string; optionsMap: Record<string, string[]> };
}

export interface FormStep {
    title: string;
    stepType: StepType;
    infoBanner?: string;
    fields: FormField[];
}

export interface TimelineStep {
    title: string;
    description: string;
}

export interface ServiceDetail {
    serviceId: number;
    subtitle: string;
    benefits: string[];
    whoShouldApply: string[];
    eligibilityQuestions: string[];
    documents: string[];
    documentConditions?: Record<string, { field: string; values: string[]; label?: string }>;
    optionalDocuments?: string[];
    documentMaxSizes?: Record<string, number>; // in KB
    documentAllowedFileTypes?: Record<string, string[]>;
    governmentFee: 'Free' | number;
    timeline: TimelineStep[];
}
