'use strict';

const gateway = require('./indiaFilingsGateway');
const withRetry = require('./withRetry');
const { customLog } = require('./loggerHelper');
const { getActiveCatalog } = require('../models/use-cases/businessRegistrationCatalog');

// IndiaFilings create-chain orchestrator (doc v1.1 §2.4), run in the background
// after a Business Registration final submit. Persist-first: our row is the source
// of truth; every step stores its vendor id immediately and is skipped on retry
// when that id already exists, so a resumed chain never duplicates vendor records.
//
// Chain: lead → customer(gid) → startup → people → shareholdings → documents
//        → payment → engagement. Documents are non-fatal (per-doc results kept in
// the stage meta); every other step failure marks the row FAILED at that stage.

// Entity types filed with the vendor. LLP/Partnership file the capital
// contribution via stake_type CONTRIBUTION (payload confirmed 2026-09-01); the
// rest of their flow mirrors PvtLtd.
const VENDOR_ENTITY_SET = new Set(['opc', 'private_limited', 'llp', 'partnership', 'proprietorship']);

// Proprietorship files the GST PPOB smart form (`gstform`); every incorporation
// entity skips it (they file smartform1/2 instead).
const STEPS_SKIPPED_BY_ENTITY = {
    proprietorship: new Set(['shareholdings', 'smartform1', 'smartform2']),
    private_limited: new Set(['gstform']),
    opc: new Set(['gstform']),
    llp: new Set(['gstform']),
    partnership: new Set(['gstform']),
};

// Both strings VERIFIED accepted by /business/add-startup on sandbox (2026-07-07).
const VENDOR_ENTITY_TYPE = {
    private_limited: 'Private Limited Company',
    opc: 'One Person Company',
    llp: 'Limited Liability Partnership',
    partnership: 'Partnership',
    proprietorship: 'Proprietorship',
};

// catalog_id resolves from our synced businessRegistrationCatalogs — by
// service_id when the vendor maps one, else by service-name pattern (OPC was
// added to the vendor catalog on 2026-07-09; matched by name until its
// service_id is confirmed). Proprietorship = the "Proprietorship" catalog (service
// 6). Service 79 is the generic GST Registration service (used only when filing the
// GST smart form) — its doc list carries a Partnership Deed, wrong for a proprietor.
const CATALOG_SERVICE_ID_BY_ENTITY = {
    private_limited: 1,
    opc: null,
    llp: 3, // "LLP Registration"
    partnership: 10, // "Partnership Firm Registration"
    proprietorship: 6,
};

// Mirrors the FE fallback in utils/catalog.ts.
const CATALOG_NAME_PATTERN_BY_ENTITY = {
    private_limited: /private\s+limited/i,
    opc: /one\s+person|\bopc\b/i,
    llp: /\bllp\b|limited\s+liability/i,
    partnership: /partnership/i,
    proprietorship: /proprietor/i,
};

// Customer-facing names for each entity type, used in emails and WhatsApp. Not
// interchangeable with VENDOR_ENTITY_TYPE above — that is the vendor API's own
// vocabulary (e.g. it must be 'Partnership', never 'Partnership Firm').
const ENTITY_LABEL = {
    proprietorship: 'Proprietorship',
    partnership: 'Partnership Firm',
    opc: 'One Person Company (OPC)',
    private_limited: 'Private Limited Company',
    llp: 'LLP',
};
exports.ENTITY_LABEL = ENTITY_LABEL;

// document_Nid values VERIFIED on sandbox 13-07 (/v4/docs/kyc-status People
// flow): PAN=1, Aadhaar=2, Passport=3, Voters=4, DL=5, Passport Photo=7,
// Bank Statement=826. Runtime kyc-status discovery still runs first; these are
// the verified fallback keyed by our docType suffixes. NOTE: the vendor
// checklist has NO "Phone Bill" type — phoneBill falls through to 999 until
// the vendor answers where it belongs.
const DEFAULT_DOCUMENT_NID = 999;
const NID_BY_DOC_SUFFIX = { panCard: 1, aadhaarCard: 2, passport: 3, bankStatement: 826, photo: 7 };
const staticNidFor = docType => {
    const key = Object.keys(NID_BY_DOC_SUFFIX).find(k => String(docType).endsWith(k));
    return key ? NID_BY_DOC_SUFFIX[key] : undefined;
};

// Keywords used to match our docType keys against the vendor's document_type names.
const DOC_KEYWORDS = ['pan', 'aadhaar', 'aadhar', 'photo', 'bank', 'phone', 'passport', 'moa', 'aoa'];

const normalizeDocName = value => String(value || '').toLowerCase().replace(/[^a-z]/g, '');

// Resolve the vendor Nid for one of our docTypes from a person's kyc-status map.
const matchDocumentNid = (docType, nidByName) => {
    const ours = normalizeDocName(docType);
    for (const [name, nid] of Object.entries(nidByName)) {
        if (ours.includes(name) || name.includes(ours)) return nid;
    }
    for (const keyword of DOC_KEYWORDS) {
        if (!ours.includes(keyword)) continue;
        const hit = Object.keys(nidByName).find(name => name.includes(keyword));
        if (hit) return nidByName[hit];
    }
    return undefined;
};

exports.shouldRunVendorChain = entityType => VENDOR_ENTITY_SET.has(entityType);

// ── Mapping helpers ──────────────────────────────────────────────────────────

// 'tamil_nadu' -> 'Tamil Nadu' (keeps joining words lowercase: 'jammu_and_kashmir').
const LOWER_WORDS = new Set(['and', 'of']);
const deSlugState = slug =>
    String(slug || '')
        .split('_')
        .map(w => (LOWER_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');

const fullName = p => [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(' ');

// Stable identity for resume: PAN (Indian) or passport number (foreign) when
// present, else role:index. Mirrored by the FE's resolvePersonKey.
const personKey = (p, role, index) => {
    const id = p?.pan || p?.passportNumber;
    return id ? String(id).toUpperCase() : `${role}:${index}`;
};

// Vendor's accepted Relationship enum (ERR003 spells it out): "Director and
// Shareholder", "Director", "Shareholder", "Representative", "Designated
// Partner", "Partner", "Witness", "Nominee". NOTE: "Promoter" is NOT accepted.
// Map each FE promoter type onto an allowed value ("Director and Representative"
// has no combined enum value, so it files as "Director").
const RELATIONSHIP_BY_PROMOTER = {
    director: 'Director',
    director_shareholder: 'Director and Shareholder',
    director_representative: 'Director',
    shareholder: 'Shareholder',
    representative: 'Representative',
    // LLP designations — the "+ Representative" combos file as the base role
    // (no combined enum value), same rule as director_representative.
    designated_partner: 'Designated Partner',
    partner: 'Partner',
    partner_representative: 'Partner',
    designated_partner_representative: 'Designated Partner',
};
const relationshipForPromoter = promoterType =>
    RELATIONSHIP_BY_PROMOTER[promoterType] || 'Director';

// Proprietorship has no residential-address / promoter KYC step — the proprietor
// comes from the GST form (gst.*). Map it onto a person shape (buildPersonPayload
// consumes) using the PPOB/office address as the person's address. Occupation /
// qualification default to safe vendor enums so the People API accepts the record;
// the RM / vendor smart form fills anything else. Explicit data.director wins.
const buildProprietor = data => {
    const g = data.gst || {};
    const d = data.director || {};
    const parts = String(g.authorizedPerson || '').trim().split(/\s+/).filter(Boolean);
    return {
        nationality: d.nationality || 'indian',
        salutation: d.salutation || g.salutation,
        firstName: d.firstName || parts[0] || g.authorizedPerson || undefined,
        lastName: d.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : undefined),
        fathersName: d.fathersName,
        pan: d.pan || g.pan,
        verifiedPan: d.verifiedPan,
        mobile: d.mobile || g.mobile,
        email: d.email || g.email,
        dob: d.dob || g.dob,
        gender: d.gender,
        qualification: d.qualification || 'Other',
        occupation: d.occupation || 'Business Owner',
        residency: d.residency || 'INDIA',
        birthPlace: d.birthPlace || g.state,
        birthDistrict: d.birthDistrict || g.district,
        address: {
            line1: g.address,
            pincode: g.pincode,
            city: g.city,
            district: g.district,
            state: g.state,
            durationYears: d.address?.durationYears,
            durationMonths: d.address?.durationMonths,
        },
    };
};

// People to create on the vendor. OPC = director + nominee; PvtLtd = the single
// Promoters list (directors[]); LLP = the partners list (also stored in
// directors[]), each mapped to an allowed relationship value.
const buildPersons = (entityType, data) => {
    const persons = [];
    const push = (p, role, index, relationship) => {
        if (!p || !(p.firstName || p.lastName || p.pan)) return;
        persons.push({ key: personKey(p, role, index), role, index, relationship, person: p });
    };

    if (entityType === 'proprietorship') {
        // Relationship from the GST form (Proprietor/Partner/Witness — doc Table 14.2),
        // default Proprietor. The person is built from gst.*: authorized person +
        // PAN/contact, and the PPOB/office address (no separate residential address).
        push(buildProprietor(data), 'director', 0, data.gst?.relationship || 'Proprietor');
    } else if (entityType === 'opc') {
        push(data.director, 'director', 0, 'Director');
        push(data.nominee, 'nominee', 0, 'Nominee');
    } else if (entityType === 'llp') {
        (data.directors || []).forEach((p, i) =>
            push(p, 'partner', i, RELATIONSHIP_BY_PROMOTER[p?.promoterType] || 'Partner')
        );
    } else if (entityType === 'partnership') {
        // Partners live under `partners` (not `directors`); PvtLtd promoter roles.
        (data.partners || []).forEach((p, i) =>
            push(p, 'partner', i, relationshipForPromoter(p?.promoterType))
        );
    } else {
        (data.directors || []).forEach((p, i) =>
            push(p, 'director', i, relationshipForPromoter(p?.promoterType))
        );
    }
    return persons;
};

// Vendor enum is STRICT with trailing periods (doc §14): Mr., Mrs., Miss., Ms.,
// Dr., Prof. — anything else is rejected, so unmapped values are omitted.
const VENDOR_SALUTATION = {
    mr: 'Mr.', mrs: 'Mrs.', miss: 'Miss.', ms: 'Ms.', dr: 'Dr.', prof: 'Prof.',
};

// Gender enum (doc §14.2): Male, Female, Other — the FE stores lowercase values.
const VENDOR_GENDER = { male: 'Male', female: 'Female', other: 'Other' };

// Statutory suffix for the proposed company name (mirrors the FE's grey input
// suffix, 23-07) — appended to every name sent to the vendor; no double-append
// when the user already typed it.
const ENTITY_NAME_SUFFIX = { private_limited: 'Private Limited', opc: '(OPC) Private Limited', llp: 'LLP' };
const withNameSuffix = (name, entityType) => {
    const trimmed = String(name ?? '').trim();
    const suffix = ENTITY_NAME_SUFFIX[entityType];
    if (!trimmed || !suffix) return trimmed;
    return trimmed.toLowerCase().endsWith(suffix.toLowerCase()) ? trimmed : `${trimmed} ${suffix}`;
};

// Doc §14 (v1.1 MOA update): pan is MANDATORY for an INDIAN director,
// passport_number for a FOREIGN one — citizenship/residency carry the country.
const isForeign = p => String(p?.nationality || '').toLowerCase() === 'foreign';
const personCountry = p => (isForeign(p) ? String(p.citizenship || '').toUpperCase() : 'INDIA');
// RESIDENCY is where the person LIVES (drives the address behaviour); it is
// independent of citizenship — an Indian citizen can reside abroad and a
// foreign citizen can reside in India. Falls back to the citizenship country
// for legacy drafts saved before the residency field existed.
const residencyCountry = p => String(p?.residency || '').toUpperCase() || personCountry(p);
const residesAbroad = p => residencyCountry(p) !== 'INDIA';

const buildPersonPayload = (app, entry) => {
    const p = entry.person;
    const foreign = isForeign(p);
    const addr = p.address || {};
    return {
        gid: app.vendorGid,
        first_name: p.firstName,
        last_name: p.lastName || undefined,
        fname: p.fathersName || undefined,
        salutation: VENDOR_SALUTATION[String(p.salutation || '').toLowerCase().replace(/\.$/, '')],
        isd_code: p.isdCode ? String(p.isdCode).replace(/^\+/, '') : '91',
        mobile: p.mobile ? String(p.mobile) : undefined,
        email: p.email,
        // created_by REMOVED (13-07): the vendor dropped the field after their
        // creator-verification (ERR074) broke partner-created records.
        // Doc §14: dob must be YYYY-MM-DD — normalize ISO timestamps from the FE.
        dob: p.dob ? String(p.dob).slice(0, 10) : undefined,
        pan: foreign ? undefined : p.pan || undefined,
        passport_number: foreign ? p.passportNumber || undefined : undefined,
        // Citizenship = nationality country (identity); residency = where they
        // live (address). These are independent (see helpers above).
        citizenship: personCountry(p) || undefined,
        residency: residencyCountry(p) || undefined,
        din: p.din ? String(p.din) : undefined,
        qualification: p.qualification || undefined,
        occupation: p.occupation || undefined,
        gender: VENDOR_GENDER[String(p.gender || '').toLowerCase()] || undefined,
        // Place of birth (§14) — birth_place carries the STATE, birth_district
        // the district/city (vendor's field naming, confirmed 28-07).
        birth_place: p.birthPlace || undefined,
        birth_district: p.birthDistrict || undefined,
        // Residential address block (§14). The address keys on RESIDENCY, not
        // nationality: a person residing in India gets the pincode block, anyone
        // abroad gets a free-text address in their residence country.
        address_line1: addr.line1 || undefined,
        address_line2: addr.line2 || undefined,
        country_code: residesAbroad(p) ? undefined : 'IN',
        // Indian postal codes are sent (ERR085 resolved vendor-side, verified
        // 28-07). Foreign postal codes need the residency country_code to
        // validate (ERR078), which we don't send yet, so they stay off. The
        // ERR085 self-heal in the people step is the backstop.
        postal_code: residesAbroad(p) ? undefined : addr.pincode || undefined,
        area: addr.area || undefined,
        city: addr.city || undefined,
        district: addr.district || undefined,
        state: addr.state || undefined,
        // Address country = residence country.
        country: residencyCountry(p) || undefined,
        duration_year: addr.durationYears ? String(addr.durationYears) : undefined,
        duration_month: addr.durationMonths ? String(addr.durationMonths) : undefined,
        application_id: app.vendorApplicationId,
        relationship: entry.relationship,
    };
};

// Shareholding rows, indexed against the same people order the FE table used.
// Companies (PvtLtd/OPC) come from the Shareholding step (shareholding{i}.shares)
// and file as stake_type SHARES; LLP/Partnership come from the Contribution step
// (contribution{i}.amount) and file as stake_type CONTRIBUTION (₹ amount) — vendor
// payload confirmed 2026-09-01. Directors EXCLUDED from shareholding are skipped;
// corporate/legal-entity shareholders are skipped — TODO(vendor): shareholder_type.
const buildShareholdings = (data, persons, entityType) => {
    const contributionBased = entityType === 'llp' || entityType === 'partnership';
    const holders = persons.filter(
        e => e.role === 'director' || e.role === 'shareholder' || e.role === 'partner'
    );
    const rows = [];
    holders.forEach((entry, i) => {
        if (contributionBased) {
            const amount = Number(data.contribution?.[i]?.amount) || 0;
            if (amount > 0) {
                rows.push({
                    key: entry.key,
                    name: fullName(entry.person),
                    stakeType: 'CONTRIBUTION',
                    value: String(amount),
                    percentage: String(Number(data.contribution?.[i]?.profitShare) || 0),
                });
            }
            return;
        }
        const shares = Number(data.shareholding?.[i]?.shares) || 0;
        const isCorporate = Boolean(data.shareholding?.[i]?.isCorporate);
        const excluded = Boolean(data.shareholding?.[i]?.excluded);
        if (shares > 0 && !isCorporate && !excluded) {
            rows.push({ key: entry.key, name: fullName(entry.person), shares });
        }
    });
    return rows;
};

// Smart form dates are DD-MM-YYYY — the OPPOSITE of /people's YYYY-MM-DD (§20.3).
const smartFormDate = value => {
    const [y, m, d] = String(value ?? '').slice(0, 10).split('-');
    return y && m && d ? `${d}-${m}-${y}` : '';
};


// Smart forms (§21, sequencing confirmed by vendor 21-07): TWO drafts per
// engagement — Form 1 (form_id "1") is the NAME APPLICATION, filed alongside
// business/application creation; Form 2 (form_id "2") is the INCORPORATION
// APPLICATION, filed at final submit to complete the submission.
// engagement_id is the numeric eid.

// Form 1 — proposed business names & activities (§21.1). Activities use the
// "CODE: name" format (colon), unlike Form 2's plain activity label.
const buildSmartForm1Payload = (app, data, contact) => {
    const names = data.proposedNames || {};
    const legal = name => withNameSuffix(name, app.entityType);
    const payload = {
        engagement_id: String(app.vendorEngagementId ?? ''),
        form: 'DRAFT',
        form_id: '1',
        name1: legal(names.first || app.businessName),
        // name2 is required by the doc — fall back to the first choice.
        name2: legal(names.second || names.first || app.businessName),
        business_description: data.businessDescription || '',
        business_activity: (data.businessActivities || []).map(a => `${a.code}: ${a.label}`),
        signatory: contact.fullName || '',
    };
    if (names.third) payload.name3 = legal(names.third);
    if (names.fourth) payload.name4 = legal(names.fourth);
    return payload;
};

// Form 2 — incorporation details (§21.2). Address + coordinates come from the
// Basic Info office-address section. Per-partner address/birth fields and DSC
// expiry are not collected in our KYC form — sent empty.
const buildSmartForm2Payload = (app, data, contact, persons) => {
    const addr = data.registeredOfficeAddress || {};
    const joined = persons
        .map(entry => {
            const vp = (app.vendorPeople || []).find(v => v.key === entry.key);
            return vp?.peopleId ? { entry, peopleId: String(vp.peopleId) } : null;
        })
        .filter(Boolean);
    const shares = app.vendorShareholdings || [];
    const totalShares = shares.reduce((sum, s) => sum + (Number(s.shares) || 0), 0);
    const activity = (data.businessActivities || [])[0];

    const partner_details = joined.map(({ entry, peopleId }) => {
        const p = entry.person;
        const addr = p.address || {};
        const salutation =
            VENDOR_SALUTATION[String(p.salutation || '').toLowerCase().replace(/\.$/, '')] || '';
        const citizenship = personCountry(p) || 'INDIA';
        const residence = residencyCountry(p) || 'INDIA';
        const partner = {
            id: peopleId,
            din: p.din ? String(p.din) : '0',
            pan: p.pan || '',
            aadhaar: p.aadhaar || '',
            first_name: p.firstName || '',
            middle_name: p.middleName || '',
            last_name: p.lastName || '',
            fullname: [salutation, p.firstName, p.middleName, p.lastName].filter(Boolean).join(' '),
            salutation,
            father_name: p.fathersName || '',
            email: p.email || '',
            mobile: p.mobile ? String(p.mobile) : '',
            date_of_birth: smartFormDate(p.dob),
            // Address country = residence; citizenship stays nationality-derived.
            country: residence,
            residency: residence,
            citizenship,
            birth_place: p.birthPlace || '',
            birth_district: p.birthDistrict || '',
            occupation: p.occupation || '',
            qualification: p.qualification || '',
            relationship: entry.relationship,
            city: addr.city || '',
            state: addr.state || '',
            postal_code: addr.pincode || '',
            address_line1: addr.line1 || '',
            address_line2: addr.line2 || '',
            dsc_expiry: '',
            duration_year: Number(addr.durationYears) || 0,
            duration_month: String(addr.durationMonths || '0'),
        };
        if (isForeign(p)) partner.passport_number = p.passportNumber || '';
        return partner;
    });

    // value is the ₹ share value (shares × face value), not the share count
    // (doc §21.5 — e.g. 250000 at 50.00%).
    const faceValue = Number(data.faceValuePerShare) || 0;
    const share_holder_details = joined
        .map(({ entry, peopleId }) => {
            const row = shares.find(s => s.key === entry.key);
            if (!row) return null;
            // LLP/Partnership: value = ₹ contribution, percentage = profit-share %
            // (from the Contribution step). Companies: value = shares × face value,
            // percentage = share of the total.
            if (row.stakeType === 'CONTRIBUTION') {
                return {
                    type: 'people',
                    id: peopleId,
                    name: row.name,
                    value: String(row.value ?? ''),
                    percentage: (Number(row.percentage) || 0).toFixed(2),
                };
            }
            const shareCount = Number(row.shares) || 0;
            return {
                type: 'people',
                id: peopleId,
                name: row.name,
                value: String(faceValue ? shareCount * faceValue : shareCount),
                percentage: totalShares ? ((100 * shareCount) / totalShares).toFixed(2) : '0.00',
            };
        })
        .filter(Boolean);

    const promoter_details = joined.map(({ entry, peopleId }) => {
        const pAddr = entry.person.address || {};
        return {
            id: peopleId,
            promoter_pan: entry.person.pan || '',
            promoter_dob: smartFormDate(entry.person.dob),
            promoter_dsc: '',
            promoter_father_name: entry.person.fathersName || '',
            promoter_city: pAddr.city || '',
            promoter_address: [pAddr.line1, pAddr.line2, pAddr.city, pAddr.state, pAddr.pincode]
                .filter(Boolean)
                .join(', '),
        };
    });

    return {
        open_application_id: String(app.vendorApplicationId ?? ''),
        engagement_id: String(app.vendorEngagementId ?? ''),
        form: 'DRAFT',
        form_id: '2',
        approved_name: withNameSuffix(data.proposedNames?.first || app.businessName, app.entityType),
        signatory: contact.fullName || '',
        // Office business contact — the registered-office section defaults these
        // from the primary contact but lets the user override them (both fields
        // are in the v1.1 Form 2 spec). `business_area` is captured in the UI but
        // NOT sent yet: it isn't in the v1.1 Form 2 body — pending vendor
        // confirmation of the field name (query raised) so we don't risk a
        // validation error on an unknown field.
        business_mobile: String(addr.businessMobile || contact.mobile || ''),
        business_email: addr.businessEmail || contact.email || '',
        activity: activity ? activity.label : '',
        // LLP/Partnership: total capital contribution. Companies: subscribed/paid-up
        // capital issued now (may be ≤ authorized).
        contribution: String(data.totalContribution ?? data.paidUpCapital ?? data.authorizedCapital ?? ''),
        address_line1: addr.line1 || '',
        address_line2: addr.line2 || '',
        full_address: [addr.line1, addr.line2, addr.area, addr.city, addr.district, addr.state, addr.pincode]
            .filter(Boolean)
            .join(', '),
        business_city: addr.city || '',
        business_district: addr.district || '',
        business_state: addr.state || deSlugState(data.stateOfIncorporation) || '',
        business_pincode: addr.pincode || '',
        business_latitude: addr.latitude || '',
        business_longitude: addr.longitude || '',
        landlord_name: addr.landlordName || '',
        partner_details,
        share_holder_details,
        promoter_details,
    };
};

// GST Registration PPOB smart form (proprietorship) — vendor payload 2026-09-21.
// Unlike the incorporation forms this nests everything under form_data and carries
// an email_template block. One DRAFT, form_id "1". Filed at final submit so the
// proprietor's people_id (people step) is available. cin_llpin/incorporated_date
// stay empty — a proprietor has neither.
const buildGstSmartFormPayload = (app, data, contact, persons) => {
    const g = data.gst || {};
    const propEntry = persons[0];
    const vendorPerson = propEntry ? (app.vendorPeople || []).find(v => v.key === propEntry.key) : null;
    const peopleId = vendorPerson?.peopleId ? String(vendorPerson.peopleId) : '';
    const salutation =
        VENDOR_SALUTATION[String(g.salutation || '').toLowerCase().replace(/\.$/, '')] || '';
    const authorizedPerson = [salutation, g.authorizedPerson].filter(Boolean).join(' ').trim();

    // Nature of business activity — multi-select joined; 'Others' swaps in its text.
    const activities = Array.isArray(g.businessActivity) ? g.businessActivity : [];
    const natureOfBusiness = activities
        .map(a => (a === 'Others' && g.businessActivityOthers ? g.businessActivityOthers : a))
        .filter(Boolean)
        .join(', ');
    // Top 5 HSN/SAC — pending the vendor search API; sent as-is when present.
    const goodsOrServices = Array.isArray(g.hsnSac) ? g.hsnSac.filter(Boolean) : [];
    const proprietorDob = smartFormDate(propEntry?.person?.dob);

    const partner_details = propEntry
        ? [{
            people_id: peopleId,
            fullname: authorizedPerson || fullName(propEntry.person),
            relationship: propEntry.relationship,
            pan: propEntry.person.pan || g.pan || '',
            din: '-',
            date_of_birth: proprietorDob || '-',
            dsc_expiry: '-',
        }]
        : [];

    const form_data = {
        business_name: g.businessName || '',
        applicant_type: g.applicantType || '',
        entity: VENDOR_ENTITY_TYPE[app.entityType] || 'Proprietorship',
        salutation,
        authorized_person: authorizedPerson,
        authorized_person_id: peopleId,
        client_name: contact.fullName || authorizedPerson || '',
        pan: g.pan || '',
        date_of_birth: proprietorDob,
        cin_llpin: '',
        incorporated_date: '',
        gst_applying_email: g.email || '',
        mobile_no: g.mobile ? String(g.mobile) : '',
        client_address: g.address || '',
        gst_applying_state: g.state || '',
        district: g.district || '',
        pincode: g.pincode ? String(g.pincode) : '',
        city: g.city || '',
        place: g.district || g.city || '',
        range: g.range || '',
        division: g.division || '',
        commissionerate: g.commissionerate || '',
        circle: g.circle || '',
        premises: g.premises || '',
        nature_of_business_activity: natureOfBusiness,
        goodsorservices: goodsOrServices,
        registration_under_rule: g.rule14a || '',
        gstregi_draft: ' ',
        gst_ppob_form_drafted: '1',
        partner_details,
    };

    return {
        engagement_id: String(app.vendorEngagementId ?? ''),
        form: 'DRAFT',
        form_id: '1',
        form_data,
        email_template: {
            applicant_type: form_data.applicant_type,
            business_name: form_data.business_name,
            'salutation signatory': authorizedPerson,
            gst_applying_state: form_data.gst_applying_state,
            nature_of_business_activity: natureOfBusiness,
            top5_goods_and_services: goodsOrServices.join(', '),
            address: form_data.client_address,
            partner_details,
        },
    };
};

const resolveCatalogRow = async entityType => {
    const serviceId = CATALOG_SERVICE_ID_BY_ENTITY[entityType];
    if (serviceId) {
        const rows = await getActiveCatalog({ serviceId });
        if (rows?.length) return rows[0];
    }
    const pattern = CATALOG_NAME_PATTERN_BY_ENTITY[entityType];
    if (!pattern) return null;
    const all = await getActiveCatalog();
    return all.find(row => pattern.test(String(row.serviceName || ''))) || null;
};
// Reused by the draft endpoint to price applications server-side.
exports.resolveCatalogRow = resolveCatalogRow;

// Display name of the service for customer notifications: the catalog's own
// serviceName when a row resolves, else the entity label. A failed catalog lookup
// falls through to the label rather than throwing — it must never block a message.
exports.resolveServiceName = async entityType => {
    try {
        const row = await resolveCatalogRow(entityType);
        if (row?.serviceName) return row.serviceName;
    } catch (error) {
        customLog(null, 'error', {
            message: 'Catalog lookup failed while resolving a service name',
            entityType,
            error: error.message,
        });
    }
    return ENTITY_LABEL[entityType] || entityType || null;
};

// All active variants for the entity (same service_id). resolveCatalogRow returns
// the first; this returns every variant so the payment page can offer a choice.
const resolveCatalogRows = async entityType => {
    const serviceId = CATALOG_SERVICE_ID_BY_ENTITY[entityType];
    if (serviceId) {
        const rows = await getActiveCatalog({ serviceId });
        if (rows?.length) return rows;
    }
    const pattern = CATALOG_NAME_PATTERN_BY_ENTITY[entityType];
    if (!pattern) return [];
    const all = await getActiveCatalog();
    return all.filter(row => pattern.test(String(row.serviceName || '')));
};
exports.resolveCatalogRows = resolveCatalogRows;

// Only an explicit gid field counts — customer_id is NOT a gid (add-startup
// rejects it with EB005, proven on sandbox 2026-07-08); the JWT gid claim is
// the reliable fallback.
const resolveGid = resp => {
    const d = resp?.data ?? resp;
    const obj = Array.isArray(d) ? d[0] : d;
    const gid = obj?.gid ?? resp?.gid;
    return gid != null ? String(gid) : null;
};

// Prefer the vendor's structured error (e.g. {errorCode:'EB005', errorMessage:
// 'Please Enter Valid Customer GID'}) over axios's generic "status code 400".
const vendorMessage = err => {
    const data = err?.response?.data;
    if (data && typeof data === 'object') {
        const msg = data.errorMessage || data.message || JSON.stringify(data);
        return data.errorCode ? `${data.errorCode}: ${msg}` : msg;
    }
    return err?.message || 'Unknown vendor error';
};

// ── Stage persistence helpers ────────────────────────────────────────────────

const stampStage = async (app, key, stage, extra = {}) => {
    // Re-read first: concurrent syncs stamp the same row.
    await app.reload();
    const stages = { ...(app.vendorStages || {}), [key]: { ...stage, at: new Date().toISOString() } };
    await app.update({ vendorStages: stages, ...extra });
};

// ── The chain ────────────────────────────────────────────────────────────────

// phaseKeys runs a subset of steps (e.g. the payment phase right after OUR wallet
// debit) — stages are stamped but vendorStatus is left untouched so the full
// chain at final submit owns the SENT/FAILED outcome and re-runs anything failed.
// onlyDocTypes (documents phase) scopes the upload to just those docTypes — the
// per-step sync passes the doc(s) being uploaded so we never re-attempt a
// different, previously-failed doc on every single upload.
exports.runVendorChain = async (application, { logTraceId, phaseKeys, onlyDocTypes, forceSmartForm2 = false } = {}) => {
    const app = application;
    const data = app.applicationData || {};
    const isPhase = Array.isArray(phaseKeys) && phaseKeys.length > 0;
    const log = (level, message, meta) =>
        customLog(logTraceId, level, { message: `[brVendorChain] ${message}`, applicationId: app.applicationId, ...meta });

    const cfg = await gateway.getConfig();
    if (cfg.error) {
        if (!isPhase) await app.update({ vendorStatus: 'FAILED', vendorError: cfg.error });
        log('error', `vendor config unavailable: ${cfg.error}`);
        return { ok: false, error: cfg.error };
    }

    if (!isPhase) {
        await app.update({
            vendorStatus: 'SENDING',
            vendorError: null,
            vendorAttempts: (app.vendorAttempts || 0) + 1,
        });
    }

    const persons = buildPersons(app.entityType, data);
    const contact = data.primaryContact || {};
    const catalogRow = await resolveCatalogRow(app.entityType);
    const catalogId = catalogRow?.vendorCatalogId || null;

    const steps = [
        {
            key: 'lead',
            isDone: () => Boolean(app.vendorLeadId),
            run: async () => {
                const res = await withRetry(() =>
                    gateway.createLead(cfg, {
                        name: contact.fullName || app.businessName || 'Peko Corporate',
                        email: contact.email || undefined,
                        country_code: 91,
                        mobile: contact.mobile ? Number(contact.mobile) : undefined,
                        lead_source: 'PEKO_PARTNER',
                        ...(catalogId ? { catalog_id: String(catalogId) } : {}),
                    })
                );
                // Sandbox returns customer_id (not the doc's lead_id) + lead_data:'exists'
                // when the lead already exists — idempotent either way.
                await stampStage(app, 'lead', { status: 'done' }, {
                    vendorLeadId: String(res?.lead_id ?? res?.customer_id ?? '') || null,
                });
            },
        },
        {
            key: 'customer',
            isDone: () => Boolean(app.vendorGid),
            run: async () => {
                if (!contact.email) throw new Error('primary contact email missing — cannot resolve gid');
                const res = await withRetry(() => gateway.getCustomer(cfg, { email: contact.email }));
                // Profile-level gid if the vendor ever adds one; otherwise the gid claim
                // from our login JWT (the partner account's gid — verified present on
                // sandbox). TODO(vendor): confirm filings are created under the partner
                // gid vs a per-customer gid.
                const gid = resolveGid(res) ?? (await gateway.getTokenGid(cfg));
                if (!gid) throw new Error('could not resolve gid (no profile gid, no gid claim in login token)');
                await stampStage(app, 'customer', { status: 'done' }, { vendorGid: gid });
            },
        },
        {
            key: 'startup',
            isDone: () => Boolean(app.vendorApplicationId),
            run: async () => {
                const startupPayload = () => ({
                    gid: app.vendorGid,
                    proposed_name: withNameSuffix(data.proposedNames?.first, app.entityType),
                    state: deSlugState(data.stateOfIncorporation),
                    entity_type: VENDOR_ENTITY_TYPE[app.entityType],
                });
                let res;
                try {
                    res = await withRetry(() => gateway.addStartup(cfg, startupPayload()));
                } catch (err) {
                    // Self-heal rows that stored a customer_id as gid (EB005):
                    // re-resolve from the login-token gid claim and retry once.
                    const tokenGid = String(err?.response?.data?.errorCode) === 'EB005'
                        ? await gateway.getTokenGid(cfg)
                        : null;
                    if (!tokenGid || tokenGid === app.vendorGid) throw err;
                    await app.update({ vendorGid: tokenGid });
                    res = await withRetry(() => gateway.addStartup(cfg, startupPayload()));
                }
                const vendorAppId = String(res?.application_id ?? '') || null;
                if (!vendorAppId) throw new Error('add-startup returned no application_id');
                await stampStage(app, 'startup', { status: 'done' }, { vendorApplicationId: vendorAppId });
            },
        },
        {
            key: 'people',
            // Done only when every person exists on the vendor AND their details are
            // unchanged (fingerprint) — edited directors re-sync via the vendor's
            // upsert ("Person already exists and updated successfully").
            isDone: () =>
                persons.length > 0 &&
                persons.every(e => {
                    const v = (app.vendorPeople || []).find(x => x.key === e.key);
                    return Boolean(v?.peopleId) && v.fingerprint === JSON.stringify(buildPersonPayload(app, e));
                }),
            run: async () => {
                const existing = app.vendorPeople || [];
                for (const entry of persons) {
                    const payload = buildPersonPayload(app, entry);
                    const fingerprint = JSON.stringify(payload);
                    const current = existing.find(v => v.key === entry.key);
                    if (current?.peopleId && current.fingerprint === fingerprint) continue;

                    let res;
                    try {
                        res = await withRetry(() => gateway.createPerson(cfg, payload));
                    } catch (err) {
                        // ERR085: the vendor verifies postal_code against their own
                        // pincode DB, which is missing valid pincodes (400601 fails,
                        // 21-07 — raised with vendor). Retry once without it so an
                        // unknown pincode never blocks director sync.
                        if (String(err?.response?.data?.errorCode) !== 'ERR085') {
                            // Name the person so a multi-person entity (Pvt directors,
                            // OPC director+nominee) shows WHICH one the vendor rejected
                            // instead of a bare "ERR011".
                            const name = fullName(entry.person);
                            const who = name
                                ? `${entry.relationship} ${name}`
                                : `${entry.relationship} ${entry.index + 1}`;
                            throw new Error(`${who} — ${vendorMessage(err)}`);
                        }
                        log('info', `postal_code rejected (ERR085) for ${entry.key} — retrying without it`);
                        const withoutPostal = { ...payload };
                        delete withoutPostal.postal_code;
                        res = await withRetry(() => gateway.createPerson(cfg, withoutPostal));
                    }
                    log('info', `add-director response (${entry.key}, ${entry.relationship})`, {
                        response: res,
                    });
                    const peopleId = String(res?.people_id ?? current?.peopleId ?? '') || null;
                    if (!peopleId) throw new Error(`people: no people_id returned for ${entry.key}`);

                    const record = {
                        key: entry.key,
                        role: entry.role,
                        index: entry.index,
                        peopleId,
                        name: fullName(entry.person),
                        fingerprint,
                    };
                    const idx = existing.findIndex(v => v.key === entry.key);
                    if (idx >= 0) existing[idx] = record;
                    else existing.push(record);
                    // Persist after each person so a failure mid-list resumes cleanly.
                    await app.update({ vendorPeople: [...existing] });
                }
                await stampStage(app, 'people', { status: 'done', meta: { count: existing.length } });
            },
        },
        {
            key: 'shareholdings',
            // Fatal again since 2026-07-10: /v4/shareholdings verified working on
            // UAT (201 shareholding_id) — a failure here should block SENT.
            isDone: () => {
                const rows = buildShareholdings(data, persons, app.entityType);
                return rows.length > 0 && rows.every(r => (app.vendorShareholdings || []).some(v => v.key === r.key && v.shareholdingId));
            },
            run: async () => {
                const rows = buildShareholdings(data, persons, app.entityType);
                if (!rows.length) {
                    await stampStage(app, 'shareholdings', { status: 'skipped', meta: 'no person shareholding rows' });
                    return;
                }
                const existing = app.vendorShareholdings || [];
                for (const row of rows) {
                    if (existing.some(v => v.key === row.key && v.shareholdingId)) continue;
                    // Link the vendor person record (created in the people step —
                    // shared with the director when they're the same person) so the
                    // vendor doesn't have to name-match the shareholder.
                    const vendorPerson = (app.vendorPeople || []).find(v => v.key === row.key);
                    // LLP/Partnership file the ₹ contribution (stake_type CONTRIBUTION);
                    // companies file the share count (stake_type SHARES) as before.
                    const stake =
                        row.stakeType === 'CONTRIBUTION'
                            ? { stake_type: 'CONTRIBUTION', value: row.value }
                            : { stake_type: 'SHARES', value: String(row.shares) };
                    const res = await withRetry(() =>
                        gateway.createShareholding(cfg, {
                            application_id: app.vendorApplicationId,
                            region: 'IND',
                            shareholder_name: row.name,
                            type: 'credit',
                            shareholder_type: 'PERSON',
                            ...stake,
                            ...(vendorPerson?.peopleId ? { people_id: vendorPerson.peopleId } : {}),
                        })
                    );
                    existing.push({
                        key: row.key,
                        name: row.name,
                        shares: row.shares,
                        value: row.value,
                        percentage: row.percentage,
                        shareholdingId: String(res?.shareholding_id ?? '') || null,
                    });
                    await app.update({ vendorShareholdings: [...existing] });
                }
                await stampStage(app, 'shareholdings', { status: 'done', meta: { count: existing.length } });
            },
        },
        {
            key: 'documents',
            // Non-fatal in the chain (the per-step documents-sync already uploaded
            // them and blocked the user on failure — this is the final-submit
            // safety net). Done is GRANULAR (every doc has a vendorDocId), not just
            // the stage flag, so a doc added/replaced on resume re-uploads.
            nonFatal: true,
            isDone: () => {
                const all = Array.isArray(app.documents) ? app.documents : [];
                const docs = onlyDocTypes ? all.filter(d => onlyDocTypes.includes(d.docType)) : all;
                return docs.length === 0
                    ? ['done', 'skipped'].includes(app.vendorStages?.documents?.status)
                    : docs.every(d => d.vendorDocId);
            },
            run: async () => {
                const allDocs = Array.isArray(app.documents) ? [...app.documents] : [];
                if (!allDocs.length) {
                    await stampStage(app, 'documents', { status: 'skipped', meta: 'no documents uploaded' });
                    return;
                }
                // Scope to just the incoming doc(s) so a per-step sync uploads ONLY
                // what the user picked — not every other still-pending/failed doc.
                const docs = onlyDocTypes ? allDocs.filter(d => onlyDocTypes.includes(d.docType)) : allDocs;
                if (!docs.length) return;
                // Merge over a fresh copy: concurrent syncs write the same column.
                const scoped = new Set(docs.map(d => d.docType));
                const persistDocs = async () => {
                    await app.reload();
                    const current = Array.isArray(app.documents) ? app.documents : [];
                    await app.update({ documents: [...current.filter(d => !scoped.has(d.docType)), ...docs] });
                };
                const people = app.vendorPeople || [];
                const results = [];

                // document_Nid map from /docs/kyc-status (doc §17). The checklist is
                // per ROLE (all directors share one; shareholders may differ), so one
                // call per role present — best-effort, falls back to the static Nids.
                const nidMaps = {};
                const getNidMap = async vendorPerson => {
                    const cacheKey = vendorPerson.role || vendorPerson.peopleId;
                    if (nidMaps[cacheKey]) return nidMaps[cacheKey];
                    let map = {};
                    try {
                        const res = await withRetry(() =>
                            gateway.kycStatus(cfg, { request_for: 'People', kycRequest: vendorPerson.peopleId })
                        );
                        for (const d of res?.KYC?.Documents || []) {
                            if (d?.document_type && d?.document_Nid != null) {
                                map[normalizeDocName(d.document_type)] = d.document_Nid;
                            }
                        }
                    } catch (err) {
                        map = {};
                    }
                    nidMaps[cacheKey] = map;
                    return map;
                };

                // Business-level (service) docs upload against the engagement via the
                // multipart variant — resolved lazily so people-only runs skip it.
                let catalogRowPromise = null;
                const getCatalogServiceId = () => {
                    if (!catalogRowPromise) catalogRowPromise = resolveCatalogRow(app.entityType);
                    return catalogRowPromise.then(row => row?.serviceId ?? null);
                };

                // Nid fallback for service docs without one (e.g. the generated
                // MOA/AOA): match the docType against the vendor's service-doc
                // names (/v4/docs/Service) — fetched once per run, best-effort.
                let serviceNidsPromise = null;
                const getServiceNidMap = serviceId => {
                    if (!serviceNidsPromise) {
                        serviceNidsPromise = withRetry(() => gateway.getServiceDocumentTypes(cfg, serviceId))
                            .then(res => {
                                const map = {};
                                for (const d of res?.Document_types || []) {
                                    if (d?.doc_name && d?.ledgers_document_id != null && Number(d.status) === 1) {
                                        map[normalizeDocName(d.doc_name)] = d.ledgers_document_id;
                                    }
                                }
                                return map;
                            })
                            .catch(() => ({}));
                    }
                    return serviceNidsPromise;
                };

                for (const doc of docs) {
                    if (doc.vendorDocId) {
                        results.push({ docType: doc.docType, status: 'done' });
                        continue;
                    }
                    if (!doc.fileString) {
                        results.push({ docType: doc.docType, status: 'skipped', reason: 'no file content' });
                        continue;
                    }
                    const person = people.find(v => v.key === doc.personKey);
                    try {
                        let res;
                        if (person) {
                            // Prefer the Nid the FE captured from the checklist so the
                            // upload is a SINGLE vendor call; only fall back to a
                            // kyc-status lookup when the FE didn't send one.
                            let documentNid = doc.documentNid;
                            if (documentNid == null) {
                                const nidByName = await getNidMap(person);
                                documentNid =
                                    matchDocumentNid(doc.docType, nidByName) ??
                                    staticNidFor(doc.docType) ??
                                    DEFAULT_DOCUMENT_NID;
                            }
                            // No retry — return the vendor's result (success or error)
                            // immediately so the FE toast is instant, no lag.
                            res = await gateway.uploadPeopleDocument(
                                cfg,
                                {
                                    process: 'People Document',
                                    request_on: 'kyc',
                                    document_Nid: documentNid,
                                    peopleid: person.peopleId,
                                },
                                { buffer: Buffer.from(doc.fileString, 'base64'), fileName: doc.fileName }
                            );
                        } else {
                            // Service Document — needs the engagement (created at payment)
                            // and the entity's catalog service id. Nid captured by the FE
                            // from the same /v4/docs/Service list it rendered the field from.
                            if (!app.vendorEngagementId) {
                                results.push({ docType: doc.docType, status: 'failed', reason: 'no engagement yet' });
                                continue;
                            }
                            const serviceId = await getCatalogServiceId();
                            if (!serviceId) {
                                results.push({ docType: doc.docType, status: 'failed', reason: 'no catalog service id' });
                                continue;
                            }
                            const serviceNids = doc.documentNid == null ? await getServiceNidMap(serviceId) : {};
                            // No retry — immediate vendor result (single upload call).
                            res = await gateway.uploadServiceDocument(
                                cfg,
                                {
                                    process: 'Service Document',
                                    request_on: 'workspace',
                                    document_Nid:
                                        doc.documentNid ??
                                        matchDocumentNid(doc.docType, serviceNids) ??
                                        DEFAULT_DOCUMENT_NID,
                                    client_gid: app.vendorGid,
                                    application_id: app.vendorApplicationId,
                                    service_id: serviceId,
                                    engagement_id: `e${String(app.vendorEngagementId).replace(/\D/g, '')}`,
                                },
                                { buffer: Buffer.from(doc.fileString, 'base64'), fileName: doc.fileName }
                            );
                        }
                        // No upload ref = not stored by the vendor (errors can ride on a 200).
                        if (!res?.u) throw new Error(vendorMessage({ response: { data: res } }));
                        doc.vendorDocId = String(res.u);
                        doc.vendorDownloadRef = res?.dl || null;
                        delete doc.fileString;
                        await persistDocs();
                        results.push({ docType: doc.docType, status: 'done' });
                    } catch (err) {
                        const reason = vendorMessage(err);
                        results.push({ docType: doc.docType, status: 'failed', reason });
                        log('error', 'document upload failed', { docType: doc.docType, err: reason });
                    }
                }
                const failed = results.filter(r => r.status === 'failed').length;
                // Admin force-file: defer un-uploadable docs to the RM (mark
                // 'skipped') instead of 'failed', so the chain can still reach SENT.
                const docStatus = failed ? (forceSmartForm2 ? 'skipped' : 'failed') : 'done';
                // Keep other documents' results; a scoped run reports only its own.
                await app.reload();
                const previous = app.vendorStages?.documents?.meta?.results;
                const kept = (Array.isArray(previous) ? previous : []).filter(r => !scoped.has(r.docType));
                await stampStage(app, 'documents', { status: docStatus, meta: { results: [...kept, ...results] } });
            },
        },
        {
            key: 'payment',
            isDone: () => app.vendorStages?.payment?.status === 'done',
            run: async () => {
                if (!catalogId) throw new Error(`payment: no catalog_id mapped for ${app.entityType} (vendor to confirm)`);
                // Verified (v1.0 sandbox testing): payment_id + total_amount are REQUIRED
                // (doc example incomplete). total_amount = our displayed price; the
                // payment_id source is still unconfirmed with the vendor — this step
                // fails with their validation error until they answer.
                const totalAmount =
                    catalogRow?.amount != null ? Number(catalogRow.amount) : Number(catalogRow?.vendorPrice) || 0;
                // Doc §19 (updated): payment_id, currency, total_amount, catalog_id
                // and gid are the exact required set — mobile/entity were removed.
                // payment_id is typed number; corporateTxnId is our numeric txn ref.
                const paymentRef = Number(app.corporateTxnId) || Date.now();
                const res = await withRetry(() =>
                    gateway.createOrder(cfg, {
                        gid: app.vendorGid,
                        currency: 'INR',
                        catalog_id: Number(catalogId),
                        total_amount: totalAmount,
                        payment_id: paymentRef,
                        // Numeric like gid/catalog_id, else the vendor ignores it.
                        application_id: Number(app.vendorApplicationId) || undefined,
                    })
                );
                // Sandbox shape: data = [{ transaction_id, engagement_id: 'E2170004' }];
                // doc shape: data = { engagement_id: [122323] }. Accept both.
                const engagementIds = Array.isArray(res?.data)
                    ? res.data.map(d => d?.engagement_id).filter(Boolean)
                    : res?.data?.engagement_id || [];
                const transactionIds = Array.isArray(res?.data)
                    ? res.data.map(d => d?.transaction_id).filter(Boolean)
                    : [];
                await stampStage(app, 'payment', { status: 'done', meta: { engagementIds, transactionIds } });
            },
        },
        {
            key: 'engagement',
            isDone: () => Boolean(app.vendorEngagementId),
            run: async () => {
                // VERIFIED: /payment returns the display id 'E2170004'; the lookup
                // wants the numeric eid (2170004) — strip non-digits. Best-effort.
                const fromPayment = app.vendorStages?.payment?.meta?.engagementIds?.[0];
                const numericId = value => Number(String(value ?? '').replace(/\D/g, '')) || null;
                let engagement = null;
                try {
                    const res = await withRetry(() =>
                        gateway.getEngagement(
                            cfg,
                            fromPayment
                                ? { engagement_id: numericId(fromPayment) }
                                : { gid: Number(app.vendorGid) }
                        )
                    );
                    engagement = Array.isArray(res?.data) ? res.data[0] : res?.data;
                } catch (err) {
                    engagement = null;
                }
                const eid = engagement?.eid ?? numericId(fromPayment) ?? fromPayment;
                await stampStage(app, 'engagement', { status: 'done' }, { vendorEngagementId: eid != null ? String(eid) : null });
            },
        },
        {
            key: 'smartform1',
            // Smart Form 1 = the NAME APPLICATION (§21.1). The vendor (call
            // 24-07) asked us to file it at PAYMENT time — right after the
            // engagement is created — not bundled with the final smart-file
            // step. It needs only the engagement + the proposed names/activities
            // captured at Basic Information, so it lives in the payment phase
            // right after `engagement`. Non-fatal while the vendor's
            // engagement↔Smartform linkage 422s (ETM002) are unresolved —
            // retried on the full run at submit.
            nonFatal: true,
            // done requires a real result_id — 'done' stamps without one (the
            // hollow 200s observed 21-07) re-run on the next retry.
            isDone: () =>
                app.vendorStages?.smartform1?.status === 'done' &&
                app.vendorStages.smartform1?.meta?.resultId != null,
            run: async () => {
                if (!app.vendorEngagementId) throw new Error('engagement not created yet');
                const res = await withRetry(() =>
                    gateway.fileSmartForm(cfg, buildSmartForm1Payload(app, data, contact))
                );
                // A real filed draft returns result_id — a 200 without one is
                // NOT success (observed 21-07: HTTP 200, no result_id).
                if (res?.result_id == null) {
                    throw new Error(`no result_id in response: ${JSON.stringify(res)}`);
                }
                log('info', 'smart form 1 (name application) draft filed', {
                    resultId: res.result_id,
                });
                await stampStage(app, 'smartform1', {
                    status: 'done',
                    meta: { resultId: res.result_id },
                });
            },
        },
        {
            key: 'smartform2',
            // Smart Form 2 = the INCORPORATION APPLICATION (vendor 21-07):
            // filed as a DRAFT at final submit — this completes the submission
            // (Form 1 was already filed at name-application time, see the
            // smartform1 stage). Endpoint DEPLOYED on UAT 21-07 (was 404; mock
            // retired) but still 422s on our data ("engagement_id,
            // open_application_id do not match") — open_application_id sourcing
            // is an open vendor question. Non-fatal until resolved; the
            // post-draft FILE step is also undocumented.
            nonFatal: true,
            // Same as smartform1: hollow 'done' stamps (no result_id) re-run.
            isDone: () =>
                app.vendorStages?.smartform2?.status === 'done' &&
                app.vendorStages.smartform2?.meta?.resultId != null,
            run: async () => {
                // Never file the incorporation form without its supporting
                // documents: if the documents stage didn't fully upload, skip
                // Smart Form 2 (the run stays FAILED/retryable).
                const docs = Array.isArray(app.documents) ? app.documents : [];
                const docsUploaded = docs.length === 0 || docs.every(d => d.vendorDocId);
                // Admin force-file (forceSmartForm2) bypasses this — the RM collects
                // any missing documents separately.
                if (!docsUploaded && !forceSmartForm2) {
                    throw new Error('documents not fully uploaded — Smart Form 2 skipped');
                }
                const res = await withRetry(() =>
                    gateway.fileSmartForm(cfg, buildSmartForm2Payload(app, data, contact, persons))
                );
                // Same strictness as smartform1 — 200 without result_id ≠ filed.
                if (res?.result_id == null) {
                    throw new Error(`no result_id in response: ${JSON.stringify(res)}`);
                }
                log('info', 'smart form 2 (incorporation) draft filed', {
                    resultId: res.result_id,
                });
                await stampStage(app, 'smartform2', {
                    status: 'done',
                    meta: { resultId: res.result_id },
                });
            },
        },
        {
            key: 'gstform',
            // GST Registration PPOB smart form — proprietorship only (incorporation
            // entities skip it). Filed as a DRAFT at final submit, after people +
            // documents so the proprietor's people_id and KYC docs exist. Non-fatal
            // like the incorporation forms; a 200 without result_id re-runs.
            nonFatal: true,
            isDone: () =>
                app.vendorStages?.gstform?.status === 'done' &&
                app.vendorStages.gstform?.meta?.resultId != null,
            run: async () => {
                const docs = Array.isArray(app.documents) ? app.documents : [];
                const docsUploaded = docs.length === 0 || docs.every(d => d.vendorDocId);
                if (!docsUploaded && !forceSmartForm2) {
                    throw new Error('documents not fully uploaded — GST smart form skipped');
                }
                const res = await withRetry(() =>
                    gateway.fileSmartForm(cfg, buildGstSmartFormPayload(app, data, contact, persons))
                );
                if (res?.result_id == null) {
                    throw new Error(`no result_id in response: ${JSON.stringify(res)}`);
                }
                log('info', 'GST PPOB smart form draft filed', { resultId: res.result_id });
                await stampStage(app, 'gstform', { status: 'done', meta: { resultId: res.result_id } });
            },
        },
    ];

    // Drop steps that don't apply to this entity (e.g. proprietorship has no
    // shareholding / incorporation smart forms) before the phase filter.
    const skip = STEPS_SKIPPED_BY_ENTITY[app.entityType];
    const entitySteps = skip ? steps.filter(step => !skip.has(step.key)) : steps;
    const activeSteps = isPhase
        ? entitySteps.filter(step => phaseKeys.includes(step.key))
        : entitySteps;

    for (const step of activeSteps) {
        try {
            if (step.isDone()) {
                if (app.vendorStages?.[step.key]?.status !== 'done') {
                    await stampStage(app, step.key, { status: 'done' });
                }
                continue;
            }
            await step.run();
            // A stage may record its own failure without throwing (documents).
            if (app.vendorStages?.[step.key]?.status === 'failed') log('error', `stage failed: ${step.key}`);
            else log('info', `stage done: ${step.key}`);
        } catch (err) {
            const detail = vendorMessage(err);
            const message = `${step.key}: ${detail}`;
            log('error', `stage failed: ${message}`);
            if (isPhase) {
                // Phase runs never touch vendorStatus — the full chain retries this.
                await stampStage(app, step.key, { status: 'failed', error: detail });
                return { ok: false, failedStage: step.key, error: detail };
            }
            if (step.nonFatal) {
                // Record and keep going — later steps don't depend on this one.
                await stampStage(app, step.key, { status: 'failed', error: detail });
                continue;
            }
            await stampStage(app, step.key, { status: 'failed', error: detail }, {
                vendorStatus: 'FAILED',
                vendorError: message,
            });
            return { ok: false, failedStage: step.key, error: detail };
        }
    }

    if (isPhase) {
        log('info', `phase complete: ${phaseKeys.join(', ')}`);
        return { ok: true };
    }

    // SENT only when every stage is clean; any failed (non-fatal) stage keeps the
    // row FAILED + retryable — completed stages are skipped on the next run.
    // Only live step keys count: renamed/retired stages (e.g. the old combined
    // 'smartform') must not pin old rows to FAILED forever.
    const stepKeys = new Set(steps.map(step => step.key));
    const failedStages = Object.entries(app.vendorStages || {})
        .filter(([key, stage]) => stepKeys.has(key) && stage?.status === 'failed')
        .map(([key]) => key);
    if (failedStages.length) {
        const message = `stages failed: ${failedStages.join(', ')}`;
        await app.update({ vendorStatus: 'FAILED', vendorError: message });
        log('error', `chain finished with failures — ${message}`);
        return { ok: false, failedStage: failedStages[0], error: message };
    }

    await app.update({ vendorStatus: 'SENT', vendorSentAt: new Date() });
    log('info', 'chain complete');
    return { ok: true };
};

// The at-payment subset: vendor CRM lead, gid resolution, the vendor payment
// order (engagement creation) and the engagement lookup. Runs in the background
// right after OUR wallet debit succeeds.
exports.runVendorPaymentPhase = (application, opts = {}) =>
    exports.runVendorChain(application, {
        ...opts,
        // 'startup' MUST run before 'payment' (API doc v1.1 §2.4 flow: add-startup
        // then create-order): the order/engagement links to the customer's OPEN
        // APPLICATION, so the startup application has to exist first. Creating the
        // order before it is why Smart Form 2 fails with ETM002 (engagement_id /
        // open_application_id do not match). smartform1 (name application) is then
        // filed right after the engagement, at payment time (vendor's ask). The
        // phase filter preserves the step-array order, so listing 'startup' here
        // runs it before 'payment' automatically.
        phaseKeys: ['lead', 'customer', 'startup', 'payment', 'engagement', 'smartform1'],
    });
