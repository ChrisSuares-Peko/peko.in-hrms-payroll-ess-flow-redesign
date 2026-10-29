import * as Yup from 'yup';

import { emailRegex, indianMobileRegex } from '@utils/regex';

import { EntityType } from '../types';
import { PAN_REGEX } from '../utils/pan';
import { shareholdingPeople } from '../utils/person';
import { getAllDocNames, personRequiredDocs, serviceDocFields } from '../utils/proprietorDocuments';
import {
    isDinLimitedRole,
    isDirectorRole,
    isRepresentativeRole,
    isShareholderRole,
    PVT_SHAREHOLDER_LIMITS,
} from '../utils/proprietorKyc';

// Per-step Yup schemas (CompanyIncorporation ApplicationForm pattern): the array
// from getStepSchemas is indexed by currentStep and swapped onto <Formik>, so
// "Next" validates only the fields visible on the current step.

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Whitespace guards — same wording/logic as the Company Incorporation schema
// (BR's sibling) so messages read identically across services: no leading/
// trailing blank space, no consecutive spaces, and not whitespace-only. Blank is
// left to .required(); optional fields skip when empty.
const withWhitespaceGuards = (schema: Yup.StringSchema, label: string) =>
    schema
        .test(
            'no-leading-space',
            `${cap(label)} cannot start with a blank space`,
            val => !val || !val.startsWith(' ')
        )
        .test(
            'no-trailing-space',
            `${cap(label)} cannot end with a blank space`,
            val => !val || !val.endsWith(' ')
        )
        .test(
            'no-consecutive-spaces',
            `${cap(label)} cannot contain consecutive whitespaces`,
            val => !val || !/ {2,}/.test(val)
        )
        .test(
            'not-only-whitespace',
            `${cap(label)} cannot be only whitespace`,
            val => !val || val.trim().length > 0
        );

const nameField = (label: string) =>
    withWhitespaceGuards(
        Yup.string()
            .required(`Please enter the ${label}`)
            .matches(/^[a-zA-Z\s.'-]+$/, `Please enter a valid ${label}`),
        label
    );

// Business name — needs a letter; blocks all-numeric/symbol garbage.
const BUSINESS_NAME_RE = /^(?=.*[A-Za-z])[A-Za-z0-9&.\-'() ]+$/;

const emailField = Yup.string()
    .required('Please enter the email address')
    .matches(emailRegex, 'Please enter a valid email address');

const mobileField = Yup.string()
    .required('Please enter the mobile number')
    .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number');

// Vendor rule (Summary of Changes): address line 1 & 2 are capped at 25
// characters each (spaces included).
const ADDRESS_LINE_MAX = 25;
const addressLine1 = withWhitespaceGuards(
    Yup.string()
        .required('Please enter address line 1')
        .max(ADDRESS_LINE_MAX, `Maximum ${ADDRESS_LINE_MAX} characters`),
    'address line 1'
);
const addressLine2 = withWhitespaceGuards(
    Yup.string().max(ADDRESS_LINE_MAX, `Maximum ${ADDRESS_LINE_MAX} characters`),
    'address line 2'
);

// Indian pincode: 6 digits, first digit 1-9 (never starts with 0, so "000000"
// and other all-zero/garbage values are rejected).
const INDIAN_PINCODE_RE = /^[1-9]\d{5}$/;
// City must contain at least one letter — blocks all-numeric garbage like
// "00000000000" that the plain required() check let through.
const cityField = withWhitespaceGuards(
    Yup.string()
        .required('Please enter the city')
        .matches(/[a-zA-Z]/, 'Please enter a valid city'),
    'city'
);

// How long the person has lived at their current address — both required (a
// value of 0 is valid for either, e.g. "0 years, 5 months").
const addressDurationSchema = {
    durationYears: Yup.string().required('Please enter the years at this address'),
    durationMonths: Yup.string().required('Please enter the months at this address'),
};

// Promoter (Director) address lines carry NO character cap (vendor review 2026);
// only the Nominee + Registered Office keep the 25-char limit (addressLine1/2).
const promoterAddressLine1 = withWhitespaceGuards(
    Yup.string().required('Please enter address line 1'),
    'address line 1'
);
const promoterAddressLine2 = withWhitespaceGuards(Yup.string(), 'address line 2');

// Residential address block, parameterised by the line1/line2 rules so promoters
// use unlimited lines while the nominee keeps the 25-char cap. India = pincode
// lookup (6-digit), any other residency = free-text postal code.
const personAddressSchema = (line1: Yup.StringSchema, line2: Yup.StringSchema) =>
    Yup.object().when('residency', {
        is: (residency: string) => !!residency && residency !== 'INDIA',
        then: () =>
            Yup.object().shape({
                line1,
                line2,
                pincode: Yup.string().required('Please enter the pincode / postal code'),
                city: cityField,
                state: Yup.string().required('Please enter the state'),
                ...addressDurationSchema,
            }),
        otherwise: () =>
            Yup.object().shape({
                line1,
                line2,
                pincode: Yup.string()
                    .required('Please enter the pincode')
                    .matches(INDIAN_PINCODE_RE, 'Please enter a valid 6-digit pincode'),
                city: cityField,
                state: Yup.string().required('Please enter the state'),
                ...addressDurationSchema,
            }),
    });

// Email + mobile must be unique across the business (primary contact) and every
// person (director / nominee / partner / added shareholder) — the vendor does
// NOT enforce this (it upserts people by PAN), so we validate it here. Runs off
// the full form values (Formik passes them as the validation context).
const contactUniquenessErrors = (ctx: Yup.TestContext) => {
    const values = (ctx.options.context as Record<string, unknown>) || {};
    type Contact = { email?: string; mobile?: string };
    const entries: Array<{ path: string; email: string; mobile: string }> = [];
    const add = (person: Contact | undefined, path: string) => {
        if (!person) return;
        entries.push({
            path,
            email: String(person.email ?? '')
                .trim()
                .toLowerCase(),
            mobile: String(person.mobile ?? '').trim(),
        });
    };
    add(values.primaryContact as Contact, 'primaryContact');
    add(values.director as Contact, 'director');
    add(values.nominee as Contact, 'nominee');
    (values.directors as Contact[] | undefined)?.forEach((p, i) => add(p, `directors.${i}`));
    (values.partners as Contact[] | undefined)?.forEach((p, i) => add(p, `partners.${i}`));

    const errors: Yup.ValidationError[] = [];
    const seenEmail = new Set<string>();
    const seenMobile = new Set<string>();
    entries.forEach(({ path, email, mobile }) => {
        if (email) {
            if (seenEmail.has(email)) {
                errors.push(
                    ctx.createError({
                        path: `${path}.email`,
                        message: 'This email is already used by another person or the business',
                    }) as Yup.ValidationError
                );
            }
            seenEmail.add(email);
        }
        if (mobile) {
            if (seenMobile.has(mobile)) {
                errors.push(
                    ctx.createError({
                        path: `${path}.mobile`,
                        message: 'This mobile is already used by another person or the business',
                    }) as Yup.ValidationError
                );
            }
            seenMobile.add(mobile);
        }
    });
    return errors;
};

// True when this PAN is already used by another person in the form — lets the
// verify-check step aside so the duplicate error shows instead.
const panUsedElsewhere = (pan: string | undefined, ctx: Yup.TestContext): boolean => {
    const norm = String(pan ?? '')
        .trim()
        .toUpperCase();
    if (!norm) return false;
    const values = (ctx.options.context as Record<string, unknown>) || {};
    const self = String(ctx.path ?? '').replace(/\.pan$/, '');
    const others: string[] = [];
    const add = (person: unknown, path: string) => {
        if (path === self || !person) return;
        const p = String((person as { pan?: string }).pan ?? '')
            .trim()
            .toUpperCase();
        if (p) others.push(p);
    };
    add(values.director, 'director');
    add(values.nominee, 'nominee');
    (values.directors as unknown[] | undefined)?.forEach((p, i) => add(p, `directors.${i}`));
    (values.partners as unknown[] | undefined)?.forEach((p, i) => add(p, `partners.${i}`));
    return others.includes(norm);
};

// Identity fields shared by directors / partners / nominee / proprietor.
// Vendor doc §14: PAN mandatory for Indian nationals, passport number (with
// citizenship country) mandatory for foreign nationals. Exported for the
// Add Shareholder modal, which validates a person on its own Save.
export const personSchema = Yup.object().shape({
    nationality: Yup.string().required('Please select the nationality'),
    pan: Yup.string().when('nationality', {
        is: 'foreign',
        then: schema => schema,
        otherwise: schema =>
            schema
                .required('Please enter the PAN')
                .matches(PAN_REGEX, 'Please enter a valid 10-character PAN')
                // Verify is mandatory — the entered PAN must be the one verified
                // against the vendor (auto-invalidated if the PAN is edited).
                .test(
                    'pan-verified',
                    'Please verify the PAN before continuing',
                    function testPanVerified(pan) {
                        if (!pan) return true;
                        // A duplicate is reported elsewhere — don't also demand verification.
                        if (panUsedElsewhere(pan, this)) return true;
                        return (this.parent as { verifiedPan?: string }).verifiedPan === pan;
                    }
                ),
    }),
    passportNumber: Yup.string().when('nationality', {
        is: 'foreign',
        then: schema =>
            schema
                .required('Please enter the passport number')
                .matches(/^[A-Za-z0-9]{6,12}$/, 'Please enter a valid passport number'),
        otherwise: schema => schema,
    }),
    citizenship: Yup.string().when('nationality', {
        is: 'foreign',
        then: schema => schema.required('Please enter the country of citizenship'),
        otherwise: schema => schema,
    }),
    // Where the person lives — drives the address block (India = pincode lookup,
    // else manual). Separate from nationality (which drives the identity proof).
    residency: Yup.string().required('Please select the country of residence'),
    // Place of birth (vendor: birth_place = state, birth_district = district).
    birthPlace: withWhitespaceGuards(
        Yup.string().required('Please enter the birth place (state)'),
        'birth place'
    ),
    birthDistrict: withWhitespaceGuards(
        Yup.string().required('Please enter the birth place (district / city)'),
        'birth place district'
    ),
    firstName: nameField('first name'),
    lastName: nameField('last name'),
    // Optional; letters only when provided.
    middleName: Yup.string().matches(/^[a-zA-Z\s.'-]+$/, {
        message: 'Please enter a valid middle name',
        excludeEmptyString: true,
    }),
    // Required: the MOA/AOA subscriber "relation" ("S/o. …") is built from it —
    // the vendor rejects generation when it's missing. Letters only (was
    // accepting numbers like "000000000").
    fathersName: nameField("father's name"),
    dob: Yup.string()
        .required('Please select the date of birth')
        .test('adult', 'The person must be at least 18 years old', value => {
            if (!value) return true;
            const dob = new Date(value);
            if (Number.isNaN(dob.getTime())) return false;
            const cutoff = new Date();
            cutoff.setFullYear(cutoff.getFullYear() - 18);
            return dob <= cutoff;
        }),
    // Standard MCA director fields the vendor's people API requires — were
    // optional, which let the user skip them and get rejected at director sync.
    salutation: Yup.string().required('Please select the salutation'),
    gender: Yup.string().required('Please select the gender'),
    qualification: Yup.string().required('Please select the qualification'),
    occupation: Yup.string().required('Please select the occupation'),
    din: Yup.string().matches(/^\d{8}$/, {
        message: 'DIN must be 8 digits',
        excludeEmptyString: true,
    }),
    email: emailField,
    isdCode: Yup.string().matches(/^\d{1,4}$/, {
        message: 'ISD code must be 1-4 digits',
        excludeEmptyString: true,
    }),
    // Foreign numbers are free-length; the 10-digit rule is India-only.
    mobile: Yup.string().when('nationality', {
        is: 'foreign',
        then: schema =>
            schema
                .required('Please enter the mobile number')
                .matches(/^\d{6,15}$/, 'Please enter a valid mobile number'),
        otherwise: () => mobileField,
    }),
    // Residential address (vendor doc §14) — feeds the people record, smart
    // form 2 and the MOA subscribers. Promoter address lines are uncapped
    // (vendor review 2026); behaviour keys on RESIDENCY (India = pincode block).
    address: personAddressSchema(promoterAddressLine1, promoterAddressLine2),
});

// Nominee (OPC) keeps the 25-char address-line cap — only the promoter address
// was uncapped in the 2026 review.
const nomineePersonSchema = personSchema.shape({
    address: personAddressSchema(addressLine1, addressLine2),
});

// PANs must be unique across a person FieldArray — the backend identifies each
// vendor person by PAN, so duplicates would silently merge two people into one.
const uniquePanTest = (field: 'directors' | 'partners') =>
    function testUniquePans(this: Yup.TestContext, people?: unknown[]) {
        const errors: Yup.ValidationError[] = [];
        const seen = new Set<string>();
        (people || []).forEach((p, i) => {
            const pan = String((p as { pan?: string })?.pan ?? '')
                .trim()
                .toUpperCase();
            if (!pan) return;
            if (seen.has(pan)) {
                errors.push(
                    this.createError({
                        path: `${field}.${i}.pan`,
                        message: 'This PAN is already used by another person',
                    }) as Yup.ValidationError
                );
            }
            seen.add(pan);
        });
        return errors.length ? new Yup.ValidationError(errors) : true;
    };

// Vendor rule: at most N DIRECTORS may be added without a DIN — the (N+1)th
// director onward must carry one. Only director-type promoters count; pure
// Shareholder / Representative promoters aren't directors and need no DIN.
const maxNoDinTest = (field: 'directors' | 'partners', maxNoDin: number) =>
    function testMaxNoDin(this: Yup.TestContext, people?: unknown[]) {
        const errors: Yup.ValidationError[] = [];
        let noDin = 0;
        (people || []).forEach((p, i) => {
            if (!isDinLimitedRole((p as { promoterType?: string })?.promoterType)) return;
            const din = String((p as { din?: string })?.din ?? '').trim();
            if (din) return;
            noDin += 1;
            if (noDin > maxNoDin) {
                errors.push(
                    this.createError({
                        path: `${field}.${i}.din`,
                        message: `A DIN is required — at most ${maxNoDin} directors may be added without one`,
                    }) as Yup.ValidationError
                );
            }
        });
        return errors.length ? new Yup.ValidationError(errors) : true;
    };

const getPeopleKycSchema = (
    field: 'directors' | 'partners',
    min: number,
    label: string,
    max?: number,
    maxNoDin?: number,
    // Private Limited: this is the single Promoters list (Director / Shareholder /
    // Representative). A promoter type is required on each, and at least this many
    // must be director-type promoters (Companies Act — min 2 directors).
    minDirectors?: number,
    // LLP: every partner needs a designation (also stored in promoterType), but
    // without the Pvt director/shareholder count rules.
    requireDesignation?: boolean
) => {
    let people = Yup.array()
        .of(personSchema)
        .min(min, `At least ${min} ${label} are required`)
        .test('unique-pan', 'duplicate PAN', uniquePanTest(field));
    if (max) people = people.max(max, `At most ${max} ${label} are allowed`);
    if (maxNoDin != null) {
        people = people.test('max-no-din', 'too many without DIN', maxNoDinTest(field, maxNoDin));
    }
    // Designation / promoter type required on each person — Pvt Ltd (via
    // minDirectors) and LLP (requireDesignation). LLP stops here; it has no
    // director/shareholder count rules.
    if (minDirectors != null || requireDesignation) {
        const typeMessage = requireDesignation
            ? 'Please select the designation'
            : 'Please select the promoter type';
        people = people.test(
            'promoter-type',
            'promoter type required',
            function testPromoterType(list) {
                const errors: Yup.ValidationError[] = [];
                (list || []).forEach((p, i) => {
                    if (!String((p as { promoterType?: string })?.promoterType ?? '').trim()) {
                        errors.push(
                            this.createError({
                                path: `${field}.${i}.promoterType`,
                                message: typeMessage,
                            }) as Yup.ValidationError
                        );
                    }
                });
                return errors.length ? new Yup.ValidationError(errors) : true;
            }
        );
    }
    if (requireDesignation) {
        // LLP statutory rules: at least 2 Designated Partners, and at least one
        // Indian national among the partners.
        people = people
            .test(
                'min-designated',
                'designated partners required',
                function testMinDesignated(list) {
                    const designated = (list || []).filter(p =>
                        String((p as { promoterType?: string })?.promoterType ?? '').startsWith(
                            'designated_partner'
                        )
                    ).length;
                    return (
                        designated >= 2 ||
                        this.createError({
                            path: field,
                            message: 'At least 2 Designated Partners are required',
                        })
                    );
                }
            )
            .test('one-indian', 'indian partner required', function testOneIndian(list) {
                const hasIndian = (list || []).some(
                    p =>
                        String((p as { nationality?: string })?.nationality ?? '').toLowerCase() ===
                        'indian'
                );
                return (
                    hasIndian ||
                    this.createError({
                        path: field,
                        message: 'At least one partner must be an Indian national',
                    })
                );
            });
    }
    if (minDirectors != null) {
        // Companies Act: at least `minDirectors` director-type promoters, and (R1)
        // ≥2 shareholders — enforced here so the user can't proceed with, e.g., two
        // "Director"-only promoters. "Director and Shareholder" counts as both.
        people = people
            .test('min-directors', 'directors required', function testMinDirectors(list) {
                const directors = (list || []).filter(p =>
                    isDirectorRole((p as { promoterType?: string })?.promoterType)
                ).length;
                return (
                    directors >= minDirectors ||
                    this.createError({
                        path: field,
                        message: `At least ${minDirectors} directors are required (choose "Director" or "Director and…" as the promoter type)`,
                    })
                );
            })
            // Companies Act (R1): Pvt also needs ≥2 SHAREHOLDERS — enforced here on
            // the Promoters page (not deferred to Shareholding) so the user can't
            // proceed with, e.g., two "Director"-only promoters. A "Director and
            // Shareholder" counts as both.
            .test('min-shareholders', 'shareholders required', function testMinShareholders(list) {
                const shareholders = (list || []).filter(p =>
                    isShareholderRole((p as { promoterType?: string })?.promoterType)
                ).length;
                return (
                    shareholders >= PVT_SHAREHOLDER_LIMITS.min ||
                    this.createError({
                        path: field,
                        message: `At least ${PVT_SHAREHOLDER_LIMITS.min} shareholders are required — set at least ${PVT_SHAREHOLDER_LIMITS.min} promoters as "Shareholder" or "Director and Shareholder"`,
                    })
                );
            });
    }
    // Registered office rides on the KYC step for every entity.
    return Yup.object()
        .shape({ [field]: people, ...registeredOfficeSchema })
        .test('contact-unique', 'duplicate email/mobile', function testContactUnique() {
            const errors = contactUniquenessErrors(this);
            return errors.length ? new Yup.ValidationError(errors) : true;
        });
};

// Registered office availability + address (feeds the smart-form filing).
// Collected on the KYC step — post-payment — since 23-07 (vendor-call flow);
// spread into every entity's KYC schema.
const registeredOfficeSchema = {
    registeredOffice: Yup.string().required('Please select the registered office availability'),
    // Address (+ coordinates via pincode lookup) — required only when the
    // corporate has an office.
    registeredOfficeAddress: Yup.object().when('registeredOffice', {
        is: 'have',
        then: schema =>
            schema.shape({
                line1: addressLine1,
                line2: addressLine2,
                pincode: Yup.string()
                    .required('Please enter the pincode')
                    .matches(INDIAN_PINCODE_RE, 'Please enter a valid 6-digit pincode'),
                area: Yup.string().required('Please select the area / locality'),
                city: cityField,
                state: Yup.string().required('Please enter the state'),
                landlordName: withWhitespaceGuards(
                    Yup.string().required("Please enter the landlord's name"),
                    "landlord's name"
                ),
                // Business contact for the office — defaults from the primary
                // contact (editable). Validated only when the user overrides it.
                businessMobile: Yup.string().matches(indianMobileRegex, {
                    message: 'Please enter a valid 10-digit mobile number',
                    excludeEmptyString: true,
                }),
                businessEmail: Yup.string().matches(emailRegex, {
                    message: 'Please enter a valid email address',
                    excludeEmptyString: true,
                }),
                // Coordinates are taken straight from the pincode lookup (no map).
                // Best-effort — not every pincode returns them, so not required.
                latitude: Yup.string(),
            }),
        otherwise: schema => schema,
    }),
};

export const getBasicInfoSchema = (entityType?: EntityType) =>
    Yup.object().shape({
        primaryContact: Yup.object().shape({
            fullName: nameField('full name'),
            email: emailField,
            mobile: mobileField,
        }),
        proposedNames: Yup.object()
            .shape({
                first: withWhitespaceGuards(
                    Yup.string()
                        .required('Please enter the first-choice name')
                        .min(3, 'Name must be at least 3 characters')
                        .matches(BUSINESS_NAME_RE, 'Please enter a valid business name'),
                    'name'
                ),
                second: withWhitespaceGuards(
                    Yup.string().matches(BUSINESS_NAME_RE, {
                        message: 'Please enter a valid business name',
                        excludeEmptyString: true,
                    }),
                    'name'
                ),
                third: withWhitespaceGuards(
                    Yup.string().matches(BUSINESS_NAME_RE, {
                        message: 'Please enter a valid business name',
                        excludeEmptyString: true,
                    }),
                    'name'
                ),
                fourth: withWhitespaceGuards(
                    Yup.string().matches(BUSINESS_NAME_RE, {
                        message: 'Please enter a valid business name',
                        excludeEmptyString: true,
                    }),
                    'name'
                ),
            })
            .test('distinct-names', 'duplicate names', function testDistinctNames(names) {
                const keys = ['first', 'second', 'third', 'fourth'] as const;
                const entered = keys.map(k =>
                    String((names as Record<string, unknown>)?.[k] ?? '')
                        .trim()
                        .toLowerCase()
                );
                const errors: Yup.ValidationError[] = [];
                entered.forEach((name, i) => {
                    if (name && entered.slice(0, i).includes(name)) {
                        errors.push(
                            this.createError({
                                path: `proposedNames.${keys[i]}`,
                                message: 'This name repeats an earlier choice',
                            }) as Yup.ValidationError
                        );
                    }
                });
                return errors.length ? new Yup.ValidationError(errors) : true;
            }),
        // Proprietorship captures the state via the GST Applying State step, so the
        // incorporation-state field is dropped from Basic Info and not required here.
        stateOfIncorporation:
            entityType === EntityType.PROPRIETORSHIP
                ? Yup.string()
                : Yup.string().required('Please select the state'),
        // Proprietorship collects no business activity before payment (Udyam
        // captures it later); Partnership takes it as free text (no NIC picker) —
        // neither needs the min-one rule. Every other entity must select one.
        businessActivities:
            entityType === EntityType.PROPRIETORSHIP || entityType === EntityType.PARTNERSHIP
                ? Yup.array()
                : Yup.array().min(1, 'Please select at least one business activity'),
        // Proprietorship shows no description field before payment, so it stays
        // optional there; every other entity must describe the activity.
        businessDescription:
            entityType === EntityType.PROPRIETORSHIP
                ? withWhitespaceGuards(Yup.string(), 'business description')
                : withWhitespaceGuards(
                      Yup.string()
                          .required('Please describe the business activity')
                          .min(10, 'Description must be at least 10 characters')
                          .matches(/[A-Za-z]/, 'Please enter a valid business description'),
                      'business description'
                  ),
    });

const proprietorKycSchema = Yup.object()
    .shape({ director: personSchema, ...registeredOfficeSchema })
    // The proprietor's email/mobile must not duplicate the business primary
    // contact's (same uniqueness rule every other entity enforces).
    .test('contact-unique', 'duplicate email/mobile', function testContactUnique() {
        const errors = contactUniquenessErrors(this);
        return errors.length ? new Yup.ValidationError(errors) : true;
    });

// OPC: the nominee must be a different person than the director — same PAN
// would collapse both into one vendor person (identity is keyed by PAN).
const opcKycSchema = Yup.object()
    .shape({ director: personSchema, nominee: nomineePersonSchema, ...registeredOfficeSchema })
    .test('nominee-distinct', 'nominee distinct', function testNomineeDistinct(v) {
        const values = v as { director?: { pan?: string }; nominee?: { pan?: string } };
        const dPan = String(values?.director?.pan ?? '')
            .trim()
            .toUpperCase();
        const nPan = String(values?.nominee?.pan ?? '')
            .trim()
            .toUpperCase();
        if (dPan && nPan && dPan === nPan) {
            return this.createError({
                path: 'nominee.pan',
                message: 'The nominee cannot have the same PAN as the director',
            });
        }
        return true;
    })
    .test('contact-unique', 'duplicate email/mobile', function testContactUnique() {
        const errors = contactUniquenessErrors(this);
        return errors.length ? new Yup.ValidationError(errors) : true;
    });

// Shares must be allotted to every non-excluded promoter (a pure "Director" is
// excluded). The total must equal the PAID-UP shares (paid-up capital ÷ face
// value) — not the authorized shares — and can never exceed the authorized
// shares. Paid-up capital may be ≤ authorized. Private Limited needs ≥2
// shareholders; PANs are unique across the whole Promoters list.
const getShareholdingSchema = (entityType?: EntityType) =>
    Yup.object()
        .shape({
            authorizedCapital: Yup.number()
                .typeError('Please enter the authorized capital')
                .required('Please enter the authorized capital')
                .min(100000, 'Authorized capital must be at least ₹1,00,000'),
            faceValuePerShare: Yup.number().required('Please select the face value per share'),
            paidUpCapital: Yup.number()
                .typeError('Please enter the paid-up capital')
                .required('Please enter the paid-up capital')
                .positive('Paid-up capital must be greater than 0'),
        })
        .test('shares-allotted', 'shareholding', function testShares(v) {
            const values = v as Record<string, unknown>;
            const people = shareholdingPeople(values);
            const holding = (values.shareholding ?? {}) as Record<
                string,
                { shares?: unknown; excluded?: boolean }
            >;
            const errors: Yup.ValidationError[] = [];
            let totalShares = 0;
            let activeCount = 0;
            people.forEach((_, i) => {
                if (holding[i]?.excluded) return;
                activeCount += 1;
                const shares = Number(holding[i]?.shares) || 0;
                totalShares += shares;
                if (shares <= 0) {
                    errors.push(
                        this.createError({
                            path: `shareholding.${i}.shares`,
                            message: 'Enter the shares allotted',
                        }) as Yup.ValidationError
                    );
                }
            });
            // Backstop only — the shareholder minimum is enforced on the Promoters
            // page by role. Anchored to a summary path (not a capital input) so it
            // never renders as help-text under Authorized Capital.
            if (
                entityType === EntityType.PRIVATE_LIMITED &&
                activeCount < PVT_SHAREHOLDER_LIMITS.min
            ) {
                errors.push(
                    this.createError({
                        path: 'shareholdingSummary',
                        message: `At least ${PVT_SHAREHOLDER_LIMITS.min} shareholders are required`,
                    }) as Yup.ValidationError
                );
            }
            const authorized = Number(values.authorizedCapital) || 0;
            const faceValue = Number(values.faceValuePerShare) || 0;
            const paidUp = Number(values.paidUpCapital) || 0;
            const authorizedShares = faceValue ? Math.floor(authorized / faceValue) : 0;
            // Paid-up capital is the ACTUAL capital issued now — it may be ≤ the
            // authorized capital, and must be a whole number of shares (multiple
            // of the face value). The remaining authorized shares can be issued
            // later without changing the authorized capital.
            if (authorized && paidUp && paidUp > authorized) {
                errors.push(
                    this.createError({
                        path: 'paidUpCapital',
                        message: `Paid-up capital cannot exceed the authorized capital (${authorized.toLocaleString('en-IN')})`,
                    }) as Yup.ValidationError
                );
            } else if (faceValue && paidUp && paidUp % faceValue !== 0) {
                errors.push(
                    this.createError({
                        path: 'paidUpCapital',
                        message: `Paid-up capital must be a multiple of the face value (${faceValue})`,
                    }) as Yup.ValidationError
                );
            }
            // Every paid-up share must be allotted: total allotted = paid-up ÷ face
            // value (and, implicitly, never more than the authorized shares).
            const paidUpShares = faceValue ? Math.floor(paidUp / faceValue) : 0;
            // Allotment errors belong to the pattern table, not the capital inputs —
            // anchor to the summary path (the live warning below the table already
            // surfaces the total mismatch while typing).
            if (paidUp && faceValue && paidUp <= authorized && totalShares !== paidUpShares) {
                errors.push(
                    this.createError({
                        path: 'shareholdingSummary',
                        message: `All paid-up shares must be allotted — total shares must equal ${paidUpShares.toLocaleString('en-IN')}`,
                    }) as Yup.ValidationError
                );
            }
            if (authorizedShares && totalShares > authorizedShares) {
                errors.push(
                    this.createError({
                        path: 'shareholdingSummary',
                        message: `Total shares allotted cannot exceed the authorized shares (${authorizedShares.toLocaleString('en-IN')})`,
                    }) as Yup.ValidationError
                );
            }
            return errors.length ? new Yup.ValidationError(errors) : true;
        })
        // Each "Director and Representative" must have the represented body
        // corporate's details captured on this page (vendor doc). Only enforced
        // for that role; other roles have no represented company.
        .test('rep-company', 'represented company', function testRepCompany(v) {
            const values = v as Record<string, unknown>;
            const directors =
                (values.directors as Array<{
                    promoterType?: string;
                    representedCompany?: Record<string, string>;
                }>) || [];
            const required: Array<[string, string]> = [
                ['country', "Please select the company's country"],
                ['name', 'Please enter the company name'],
                ['cin', 'Please enter the CIN / registration number'],
                ['contact', 'Please enter the company contact'],
                ['registeredOffice', 'Please enter the registered office address'],
            ];
            const errors: Yup.ValidationError[] = [];
            directors.forEach((d, i) => {
                if (!isRepresentativeRole(d?.promoterType)) return;
                required.forEach(([field, message]) => {
                    if (!String(d?.representedCompany?.[field] ?? '').trim()) {
                        errors.push(
                            this.createError({
                                path: `directors.${i}.representedCompany.${field}`,
                                message,
                            }) as Yup.ValidationError
                        );
                    }
                });
            });
            return errors.length ? new Yup.ValidationError(errors) : true;
        });

const contributionSchema = Yup.object()
    .shape({
        // LLP: total contribution — minimum ₹1,000, no maximum (vendor doc).
        totalContribution: Yup.number()
            .typeError('Please enter the total contribution')
            .required('Please enter the total contribution')
            .min(1000, 'Total contribution must be at least ₹1,000'),
    })
    // Each designated partner's contribution must be > 0 and the partner
    // contributions must add up to the total (vendor correction: 1000 total with
    // 50000 each was wrongly accepted). Profit-share % is derived from the
    // amounts, so no separate percentage check is needed.
    .test('llp-capital', 'partner capital', function testLlpCapital(rawValue) {
        const value = rawValue as
            | {
                  totalContribution?: unknown;
                  directors?: unknown[];
                  contribution?: Record<string, { amount?: unknown }>;
              }
            | undefined;
        const total = Number(value?.totalContribution) || 0;
        const partners = value?.directors || [];
        const contribution = value?.contribution || {};
        const errors: Yup.ValidationError[] = [];
        let sumAmount = 0;
        partners.forEach((_, i) => {
            const amount = Number(contribution[i]?.amount) || 0;
            if (amount <= 0) {
                errors.push(
                    this.createError({
                        path: `contribution.${i}.amount`,
                        message: 'Enter this partner’s contribution',
                    }) as Yup.ValidationError
                );
            }
            sumAmount += amount;
        });
        if (errors.length) return new Yup.ValidationError(errors);
        if (total && Math.round(sumAmount) !== Math.round(total)) {
            return this.createError({
                path: 'totalContribution',
                message: `Partner contributions (₹${sumAmount.toLocaleString('en-IN')}) must add up to the total (₹${total.toLocaleString('en-IN')})`,
            });
        }
        return true;
    });

// Partnership Capital Contribution (doc §C4): contributions must be > 0 and sum
// to the total. Profit share is derived, so no separate check.
const partnershipCapitalSchema = Yup.object()
    .shape({
        totalContribution: Yup.number()
            .typeError('Please enter the total capital contribution')
            .required('Please enter the total capital contribution')
            .moreThan(0, 'Total capital contribution must be greater than 0'),
    })
    .test('partner-capital', 'partner capital', function testPartnerCapital(rawValue) {
        // `partners` / `contribution` are sibling form fields, not part of this
        // object's shape — widen the type so we can read them off the value.
        const value = rawValue as
            | {
                  totalContribution?: unknown;
                  partners?: unknown[];
                  contribution?: Record<string, { amount?: unknown }>;
              }
            | undefined;
        const total = Number(value?.totalContribution) || 0;
        const partners = value?.partners || [];
        const contribution = value?.contribution || {};
        const errors: Yup.ValidationError[] = [];
        let sumAmount = 0;
        partners.forEach((_, i) => {
            const amount = Number(contribution[i]?.amount) || 0;
            if (amount <= 0) {
                errors.push(
                    this.createError({
                        path: `contribution.${i}.amount`,
                        message: 'Enter this partner’s contribution',
                    }) as Yup.ValidationError
                );
            }
            sumAmount += amount;
        });
        if (errors.length) return new Yup.ValidationError(errors);
        if (total && Math.round(sumAmount) !== Math.round(total)) {
            return this.createError({
                path: 'totalContribution',
                message: `Partner contributions (₹${sumAmount.toLocaleString('en-IN')}) must add up to the total (₹${total.toLocaleString('en-IN')})`,
            });
        }
        return true;
    });

// Documents step schema. Required per-person docs come from the vendor's
// per-role checklist (mandatory=1, PAN↔Passport by nationality — same list the
// upload cards render). Single-person entities validate documents.director.*;
// FieldArray entities (Private Limited directors, Partnership partners) require
// the set for EVERY person from the KYC step — people come from the validation
// context (Formik passes the full values object as context).
const getDocumentsSchema = (peopleField?: 'directors' | 'partners') =>
    Yup.object().shape({
        documents: Yup.object()
            // Business docs are OPTIONAL for now (21-07): the vendor's
            // smartservice=1 list is their full engagement document master —
            // it includes forms THEY generate during filing (INC 32/33/34,
            // declarations, even the Incorporation Certificate), which a
            // customer cannot possibly upload upfront. Which subset is truly
            // customer-supplied is pending with the vendor; person KYC docs
            // below stay required.
            .test('person-docs', 'person documents missing', function testPersonDocs(docs) {
                const context = (this.options.context as Record<string, unknown>) || {};
                // Proprietorship uploads only business documents — no per-person KYC set.
                if (context.entityType === EntityType.PROPRIETORSHIP) return true;
                const people: Array<{ nationality?: string; din?: string } | undefined> =
                    peopleField
                        ? (context[peopleField] as Array<{ nationality?: string; din?: string }>) ||
                          []
                        : [context.director as { nationality?: string; din?: string } | undefined];
                const errors: Yup.ValidationError[] = [];
                people.forEach((person, i) => {
                    const holder = peopleField
                        ? (
                              (docs as Record<string, unknown>)?.[peopleField] as
                                  | Record<string, unknown>[]
                                  | undefined
                          )?.[i]
                        : ((docs as Record<string, unknown>)?.director as
                              | Record<string, unknown>
                              | undefined);
                    const path = peopleField
                        ? `documents.${peopleField}.${i}`
                        : 'documents.director';
                    personRequiredDocs(
                        person?.nationality,
                        'director',
                        Boolean(person?.din),
                        context.entityType as EntityType
                    ).forEach(({ key, label }) => {
                        if (!holder?.[key]) {
                            errors.push(
                                this.createError({
                                    path: `${path}.${key}`,
                                    message: `Please upload the ${label}`,
                                }) as Yup.ValidationError
                            );
                        }
                    });
                });
                return errors.length ? new Yup.ValidationError(errors) : true;
            })
            // Mandatory business docs. The vendor's service list has NO mandatory
            // flag, so serviceDocFields() marks the ones we require (e.g. the
            // registered-office utility bill) and we enforce them here.
            .test('service-docs', 'business documents missing', function testServiceDocs(docs) {
                const service =
                    (docs as { service?: Record<string, unknown> } | undefined)?.service || {};
                const errors: Yup.ValidationError[] = [];
                serviceDocFields()
                    .filter(f => f.required)
                    .forEach(f => {
                        const key = f.name.split('.').pop() as string;
                        if (!service[key]) {
                            errors.push(
                                this.createError({
                                    path: f.name,
                                    message: `Please upload the ${f.label}`,
                                }) as Yup.ValidationError
                            );
                        }
                    });
                return errors.length ? new Yup.ValidationError(errors) : true;
            })
            // Vendor entities upload each file to the filing partner on the go —
            // an uploaded doc becomes a filename STRING (base64 dropped), while a
            // still-attached {name, base64} object means it hasn't reached the
            // vendor (upload pending or failed). Block Next until every attached
            // document is confirmed uploaded.
            .test('docs-uploaded', 'documents not uploaded', function testDocsUploaded() {
                const context = (this.options.context as Record<string, unknown>) || {};
                const entity = context.entityType;
                if (entity !== EntityType.OPC && entity !== EntityType.PRIVATE_LIMITED) return true;
                const errors: Yup.ValidationError[] = [];
                getAllDocNames(context).forEach(path => {
                    const val = path
                        .split('.')
                        .reduce<unknown>(
                            (acc, key) => (acc as Record<string, unknown>)?.[key],
                            context
                        );
                    if (val && typeof val === 'object') {
                        errors.push(
                            this.createError({
                                path,
                                message:
                                    'This document hasn’t finished uploading — please wait for it to upload or re-upload it.',
                            }) as Yup.ValidationError
                        );
                    }
                });
                return errors.length ? new Yup.ValidationError(errors) : true;
            }),
    });

// Proprietorship GST Registration smart-form step schemas (post-payment). All
// fields live under `gst.*`; each step validates only its own subset.
const gstApplicantSchema = Yup.object().shape({
    gst: Yup.object().shape({
        applicantType: Yup.string().required('Please select the applicant type'),
        premises: Yup.string().required('Please select the nature of possession of premises'),
        salutation: Yup.string().required('Please select the salutation'),
        authorizedPerson: nameField('authorized person'),
        relationship: Yup.string().required('Please select the relationship'),
        pan: Yup.string()
            .required('Please enter the PAN')
            .matches(PAN_REGEX, 'Please enter a valid 10-character PAN')
            .test(
                'verified',
                'Please verify the PAN — the name is filled from it',
                function verified(value) {
                    return (
                        !value || (this.parent as { verifiedPan?: string }).verifiedPan === value
                    );
                }
            ),
        dob: Yup.string()
            .required('Please select the date of birth')
            .test('adult', 'The proprietor must be at least 18 years old', value => {
                if (!value) return true;
                const d = new Date(value);
                if (Number.isNaN(d.getTime())) return false;
                const cutoff = new Date();
                cutoff.setFullYear(cutoff.getFullYear() - 18);
                return d <= cutoff;
            }),
        mobile: mobileField,
        email: emailField,
    }),
});

const isMaha = (s: unknown) => /maharashtra/i.test(String(s ?? ''));
const gstAddressSchema = Yup.object().shape({
    gst: Yup.object().shape({
        pincode: Yup.string()
            .required('Please enter the pincode')
            .matches(INDIAN_PINCODE_RE, 'Please enter a valid 6-digit pincode'),
        state: Yup.string().required('Please select the GST applying state'),
        district: Yup.string().required('Please enter the district'),
        circle: Yup.string().required('Please enter the circle'),
        commissionerate: Yup.string().required('Please enter the commissionerate'),
        division: Yup.string().required('Please enter the division'),
        range: Yup.string().required('Please enter the range'),
        // Must contain a letter — blocks all-numeric garbage like "0000000000".
        address: withWhitespaceGuards(
            Yup.string()
                .required('Please enter the address')
                .matches(/[a-zA-Z]/, 'Please enter a valid address'),
            'address'
        ),
        electricityBoard: Yup.string().when('state', {
            is: isMaha,
            then: schema => schema.required('Please select the electricity board'),
            otherwise: schema => schema,
        }),
        caNumber: Yup.string().when('state', {
            is: isMaha,
            then: schema => schema.required('Please enter the CA / consumer number'),
            otherwise: schema => schema,
        }),
    }),
});

const gstInfoSchema = Yup.object().shape({
    gst: Yup.object().shape({
        businessActivity: Yup.array().min(1, 'Please select at least one business activity'),
        rule14a: Yup.string().required('Please select the Rule 14A option'),
        businessActivityOthers: Yup.string().when('businessActivity', {
            is: (a: unknown) => Array.isArray(a) && a.includes('Others'),
            then: schema => schema.required('Please specify the other activity'),
            otherwise: schema => schema,
        }),
    }),
});

// Steps whose only requirement is a confirmation checkbox (MOA & AOA, deed,
// agreement, filing) are gated by the disabled Next button instead — null here.
export const getStepSchemas = (entityType?: EntityType): Array<Yup.AnySchema | null> => {
    const basic = getBasicInfoSchema(entityType);
    switch (entityType) {
        case EntityType.PARTNERSHIP:
            return [
                basic,
                getPeopleKycSchema('partners', 2, 'partners', 50),
                partnershipCapitalSchema,
                getDocumentsSchema('partners'),
                null,
            ];
        case EntityType.OPC:
            return [
                basic,
                opcKycSchema,
                getShareholdingSchema(EntityType.OPC),
                getDocumentsSchema(),
                null,
            ];
        case EntityType.PRIVATE_LIMITED:
            return [
                basic,
                getPeopleKycSchema('directors', 2, 'promoters', 15, 3, 2),
                getShareholdingSchema(EntityType.PRIVATE_LIMITED),
                getDocumentsSchema('directors'),
                null,
            ];
        case EntityType.LLP:
            return [
                basic,
                getPeopleKycSchema(
                    'directors',
                    2,
                    'designated partners',
                    undefined,
                    undefined,
                    undefined,
                    true
                ),
                contributionSchema,
                getDocumentsSchema('directors'),
                null,
            ];
        case EntityType.PROPRIETORSHIP:
            return [
                basic,
                gstApplicantSchema,
                gstAddressSchema,
                gstInfoSchema,
                getDocumentsSchema(),
                null,
            ];
        default:
            return [basic, proprietorKycSchema, getDocumentsSchema(), null];
    }
};

// Marks every leaf touched so validateForm() errors render (inputs gate on touched).
export const setAllTouched = (obj: Record<string, unknown>): Record<string, unknown> =>
    Object.keys(obj).reduce(
        (acc, key) => {
            const val = obj[key];
            if (Array.isArray(val)) {
                acc[key] = val.map(item =>
                    item && typeof item === 'object'
                        ? setAllTouched(item as Record<string, unknown>)
                        : undefined
                );
            } else if (val && typeof val === 'object') {
                acc[key] = setAllTouched(val as Record<string, unknown>);
            } else {
                acc[key] = true;
            }
            return acc;
        },
        {} as Record<string, unknown>
    );

const isObj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object';

// Touched map for a failed step validation: everything present in values PLUS
// every errored path — fields never interacted with (e.g. empty upload slots)
// have no entry in values, and without a touched entry their error would render
// nowhere while still blocking Next.
export const buildTouched = (
    values: Record<string, unknown>,
    errors: Record<string, unknown>
): Record<string, unknown> => {
    const merge = (a: unknown, b: unknown): unknown => {
        if (Array.isArray(a) && Array.isArray(b)) {
            return Array.from({ length: Math.max(a.length, b.length) }, (_, i) =>
                merge(a[i], b[i])
            );
        }
        if (isObj(a) && isObj(b)) {
            const out: Record<string, unknown> = { ...a };
            Object.keys(b).forEach(k => {
                out[k] = merge(
                    (a as Record<string, unknown>)[k],
                    (b as Record<string, unknown>)[k]
                );
            });
            return out;
        }
        if (isObj(a)) return a;
        if (isObj(b)) return b;
        return b ?? a;
    };
    return merge(setAllTouched(values), setAllTouched(errors)) as Record<string, unknown>;
};

export const scrollToFirstError = () => {
    // Small delay so the freshly-set errors AND any collapsed person cards
    // expanding in response (CollapsiblePersonCard effect) render before we query.
    setTimeout(() => {
        document
            .querySelector('.ant-form-item-has-error, [data-form-error="true"]')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
};
