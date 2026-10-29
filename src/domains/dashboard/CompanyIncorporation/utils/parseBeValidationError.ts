// Translates Joi-style BE validation error strings into user-friendly toast text.
// Returns null when the message can't be parsed, so the caller can fall back to
// a generic toast instead of showing raw "field.path is not allowed to be empty".

const STATIC_LABEL_MAP: Record<string, string> = {
    'applicantDetails.fullName': 'Applicant name',
    'applicantDetails.email': 'Applicant email',
    'applicantDetails.mobile': 'Applicant mobile',
    'applicantDetails.state': 'Applicant state',

    'proposedNames.firstChoice': 'First choice company name',
    'proposedNames.secondChoice': 'Second choice company name',
    'proposedNames.thirdChoice': 'Third choice company name',

    'registeredOffice.availability': 'Office availability',
    'registeredOffice.officeType': 'Office type',
    'registeredOffice.address': 'Office address',
    'registeredOffice.state': 'Office state',

    'capital.authorizedCapital': 'Authorised capital',
    'capital.paidUpCapital': 'Paid-up capital',
    'capital.faceValuePerShare': 'Face value per share',

    'businessActivity.section': 'Business section',
    'businessActivity.division': 'Business division',
    'businessActivity.group': 'Business group',
    'businessActivity.class': 'Business class',
    'businessActivity.subclass': 'Business sub-class',
    'businessActivity.description': 'Business description',

    'moaAoa.moaType': 'MOA type',
    'moaAoa.aoaType': 'AOA type',
    'moaAoa.confirmed': 'MOA & AOA confirmation',

    'llpAgreement.agreementType': 'LLP agreement type',
    'llpAgreement.meetingQuorum': 'LLP meeting quorum',
    'llpAgreement.votingThreshold': 'LLP voting threshold',
    'llpAgreement.disputeResolution.method': 'Dispute resolution method',
    'llpAgreement.disputeResolution.jurisdiction': 'Dispute resolution jurisdiction',

    'entityType': 'Entity type',
};

const PERSON_FIELD_LABELS: Record<string, string> = {
    name: 'name',
    email: 'email',
    mobile: 'mobile',
    nationality: 'nationality',
    panNumber: 'PAN',
    passportNumber: 'passport',
    din: 'DIN',
    aadhaar: 'Aadhaar',
    educationQualification: 'education qualification',
    occupation: 'occupation',
    'placeOfBirth.state': 'place of birth (state)',
    'placeOfBirth.district': 'place of birth (district)',
};

const RULE_MESSAGE_MAP: Array<{ test: RegExp; message: string }> = [
    { test: /is not allowed to be empty/i, message: 'is required' },
    { test: /is required/i, message: 'is required' },
    { test: /must be a valid email/i, message: 'must be a valid email address' },
    { test: /fails to match the required pattern/i, message: 'format is invalid' },
    { test: /must be a number/i, message: 'must be a number' },
    { test: /must be a string/i, message: 'must be a valid value' },
    { test: /must be a boolean/i, message: 'must be true or false' },
    { test: /length must be/i, message: 'has invalid length' },
    { test: /must contain at least/i, message: 'is too short' },
    { test: /must be one of/i, message: 'has an invalid value' },
    { test: /must be greater than/i, message: 'is too small' },
    { test: /must be less than/i, message: 'is too large' },
];

const humanizeKey = (key: string): string => {
    const spaced = key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .toLowerCase()
        .trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const labelForPath = (fieldPath: string): string => {
    const staticLabel = STATIC_LABEL_MAP[fieldPath];
    if (staticLabel) return staticLabel;

    // Indexed person-style paths: directors[N].x, additionalShareholders[N].x, nominee.x
    const indexedMatch = fieldPath.match(/^(directors|additionalShareholders)\[(\d+)\]\.(.+)$/);
    if (indexedMatch) {
        const root = indexedMatch[1] ?? '';
        const idx = indexedMatch[2] ?? '0';
        const rest = indexedMatch[3] ?? '';
        const personLabel = root === 'directors' ? 'Director' : 'Shareholder';
        const fieldLabel = PERSON_FIELD_LABELS[rest] ?? humanizeKey(rest).toLowerCase();
        return `${personLabel} ${Number(idx) + 1} ${fieldLabel}`;
    }

    const nomineeMatch = fieldPath.match(/^nominee\.(.+)$/);
    if (nomineeMatch) {
        const rest = nomineeMatch[1] ?? '';
        const fieldLabel = PERSON_FIELD_LABELS[rest] ?? humanizeKey(rest).toLowerCase();
        return `Nominee ${fieldLabel}`;
    }

    // Fallback: humanize each dot-segment and join with " — ".
    return fieldPath
        .split('.')
        .map(seg => humanizeKey(seg.replace(/\[\d+\]/g, m => ` ${Number(m.slice(1, -1)) + 1}`)))
        .join(' — ');
};

const friendlyRuleMessage = (rawRest: string): string => {
    const matched = RULE_MESSAGE_MAP.find(({ test }) => test.test(rawRest));
    if (matched) return matched.message;
    return rawRest.trim() || 'is invalid';
};

export const parseBeValidationError = (rawMessage: string): string | null => {
    if (!rawMessage) return null;

    // Joi joins per-field errors with ", " — but field values themselves can
    // contain commas, so split on the boundary `, "` instead (every error
    // entry begins with `"fieldPath"`).
    const parts = rawMessage.split(/,\s+(?=")/);

    const friendly = parts.map(part => {
        const m = part.match(/^"([^"]+)"\s+(.+)$/);
        if (!m) return null;
        const fieldPath = m[1] ?? '';
        const rest = m[2] ?? '';
        return `${labelForPath(fieldPath)} ${friendlyRuleMessage(rest)}.`;
    });

    if (friendly.some(msg => msg === null)) return null;
    return friendly.length > 0 ? (friendly as string[]).join('\n') : null;
};
