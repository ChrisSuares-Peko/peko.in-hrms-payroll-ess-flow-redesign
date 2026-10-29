import { GstCancellationValues } from '../types';

// Shared by GstCancellationForm.tsx and its useCancellationApplicationData hook — kept here (not in
// the page) for the same no-import-cycle reason as utils/gstForm.ts and utils/objectionForm.ts.

// IndiaFilings' vendor service_id for GST Registration Cancellation — confirmed live 2026-10-09 via
// the synced govtServicesCatalogs row (vendorCatalogId 3038, variant "Basic", ₹2,899) and the admin
// UI at /system-user/manage/government-services. See GST_Cancellation_Implementation_Plan.md's
// "Update (2026-10-09)" note. Distinct from GST_REGISTRATION_SERVICE_ID (79, utils/gstForm.ts).
export const GST_CANCELLATION_SERVICE_ID = 126;

export const isGstCancellationService = (serviceId?: number | null) =>
    serviceId === GST_CANCELLATION_SERVICE_ID;

export const CANCELLATION_STEP_TITLES = ['Cancellation Details', 'Review'];

// Vendor's fixed salutation list (GST_Registration_Cancellation_Work_Flow.docx §B shows "Mr." as
// the example) — same 6-option set GST Registration's own Step 1 and AuthorizedPersonModal use
// (utils/gstForm.ts's GST_SALUTATION_OPTIONS), kept as its own copy here since Cancellation's
// Authorized Person isn't the same shape and shouldn't import gstForm.ts for one list.
export const CANCELLATION_SALUTATION_OPTIONS = [
    'Mr.',
    'Mrs.',
    'Dr.',
    'Ms.',
    'Miss.',
    'Prof.',
].map(option => ({ label: option, value: option }));

export const EMPTY_CANCELLATION_VALUES: GstCancellationValues = {
    selectedVendorBusinessId: '',
    salutation: '',
    selectedDirectorId: '',
    authorizedPerson: '',
    reasonForCancellation: '',
    currentStep: 0,
};
