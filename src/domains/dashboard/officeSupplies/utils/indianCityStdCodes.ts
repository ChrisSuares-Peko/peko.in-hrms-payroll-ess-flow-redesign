import STD_CODES_DATASET from './stdCodes.json';

/**
 * Indian cities with their STD (telephone area) codes. ONDC encodes a city as
 * `std:<STD_CODE>` (e.g. Bangalore -> "std:080"), so these drive both the city
 * selector and the ONDC /search the backend fires.
 *
 * Two sources are merged into one index:
 *  - `stdCodes.json` — 2,644 cities `{city, state, stdCode}` (codes WITHOUT the
 *    leading zero, e.g. "80"), copied from ondc-mock-server/std-codes.json;
 *  - the curated `INDIAN_CITY_STD_CODES` below, which OVERRIDES the dataset on
 *    name collisions (its codes/names are hand-checked).
 *
 * `stdCode` in the curated list keeps its leading zero on purpose (that is the
 * ONDC convention); dataset codes get the zero restored when building codes.
 */
export type CityStdCode = {
    name: string;
    stdCode: string;
};

export type SelectedCity = {
    name: string;
    /** ONDC city code, e.g. "std:080" */
    code: string;
    /** 6-digit Indian PIN when known — ONDC /select `address.area_code` */
    pincode?: string;
};

/** Build the ONDC city code from an STD code, e.g. "080" -> "std:080". */
export const toOndcCity = (stdCode: string): string => `std:${stdCode}`;

/**
 * City used when we can't derive one from the user's profile address (no address,
 * empty city, or an unsupported city). Always a valid ONDC code.
 */
export const DEFAULT_CITY: SelectedCity = { name: 'Delhi', code: toOndcCity('011') };

/** ONDC city param, or undefined when the pin is outside India (empty code). */
export const ondcCityCode = (city?: SelectedCity | null) =>
    city?.code?.startsWith('std:') ? city.code : undefined;

export const isIndiaCountry = (value?: string | null) => {
    const v = value?.trim().toLowerCase();
    return v === 'in' || v === 'ind' || v === 'india';
};

/** Indian PIN: 6 digits, not starting with 0 — same rule as India Post. */
export const INDIAN_PIN_RE = /^[1-9]\d{5}$/;

/** Digits-only Indian PIN, or undefined when the value is not a usable PIN. */
export const indianPincode = (value?: string | null): string | undefined => {
    const digits = String(value ?? '').replace(/\D/g, '');
    return INDIAN_PIN_RE.test(digits) ? digits : undefined;
};

/** Copy of `city` with a valid PIN, or with an invalid/missing PIN stripped. */
export const withPincode = (city: SelectedCity, pincode?: string | null): SelectedCity => {
    const pin = indianPincode(pincode) ?? indianPincode(city.pincode);
    const rest = { ...city };
    delete rest.pincode;
    return pin ? { ...rest, pincode: pin } : rest;
};

export const INDIAN_CITY_STD_CODES: CityStdCode[] = [
    { name: 'Agra', stdCode: '0562' },
    { name: 'Ahmedabad', stdCode: '079' },
    { name: 'Ajmer', stdCode: '0145' },
    { name: 'Aligarh', stdCode: '0571' },
    { name: 'Allahabad (Prayagraj)', stdCode: '0532' },
    { name: 'Amritsar', stdCode: '0183' },
    { name: 'Asansol', stdCode: '0341' },
    { name: 'Aurangabad', stdCode: '0240' },
    { name: 'Bangalore', stdCode: '080' },
    { name: 'Bareilly', stdCode: '0581' },
    { name: 'Belgaum', stdCode: '0831' },
    { name: 'Bhavnagar', stdCode: '0278' },
    { name: 'Bhopal', stdCode: '0755' },
    { name: 'Bhubaneswar', stdCode: '0674' },
    { name: 'Bikaner', stdCode: '0151' },
    { name: 'Bilaspur', stdCode: '07752' },
    { name: 'Chandigarh', stdCode: '0172' },
    { name: 'Chennai', stdCode: '044' },
    { name: 'Coimbatore', stdCode: '0422' },
    { name: 'Cuttack', stdCode: '0671' },
    { name: 'Dehradun', stdCode: '0135' },
    { name: 'Delhi', stdCode: '011' },
    { name: 'Dhanbad', stdCode: '0326' },
    { name: 'Durgapur', stdCode: '0343' },
    { name: 'Erode', stdCode: '0424' },
    { name: 'Faridabad', stdCode: '0129' },
    { name: 'Ghaziabad', stdCode: '0120' },
    { name: 'Gorakhpur', stdCode: '0551' },
    { name: 'Guntur', stdCode: '0863' },
    { name: 'Gurgaon (Gurugram)', stdCode: '0124' },
    { name: 'Guwahati', stdCode: '0361' },
    { name: 'Gwalior', stdCode: '0751' },
    { name: 'Hubli', stdCode: '0836' },
    { name: 'Hyderabad', stdCode: '040' },
    { name: 'Indore', stdCode: '0731' },
    { name: 'Jabalpur', stdCode: '0761' },
    { name: 'Jaipur', stdCode: '0141' },
    { name: 'Jalandhar', stdCode: '0181' },
    { name: 'Jammu', stdCode: '0191' },
    { name: 'Jamnagar', stdCode: '0288' },
    { name: 'Jamshedpur', stdCode: '0657' },
    { name: 'Jodhpur', stdCode: '0291' },
    { name: 'Kakinada', stdCode: '0884' },
    { name: 'Kanpur', stdCode: '0512' },
    { name: 'Kochi (Cochin)', stdCode: '0484' },
    { name: 'Kolhapur', stdCode: '0231' },
    { name: 'Kolkata', stdCode: '033' },
    { name: 'Kollam', stdCode: '0474' },
    { name: 'Kota', stdCode: '0744' },
    { name: 'Kottayam', stdCode: '0481' },
    { name: 'Kozhikode (Calicut)', stdCode: '0495' },
    { name: 'Lucknow', stdCode: '0522' },
    { name: 'Ludhiana', stdCode: '0161' },
    { name: 'Madurai', stdCode: '0452' },
    { name: 'Mangalore', stdCode: '0824' },
    { name: 'Meerut', stdCode: '0121' },
    { name: 'Moradabad', stdCode: '0591' },
    { name: 'Mumbai', stdCode: '022' },
    { name: 'Mysore', stdCode: '0821' },
    { name: 'Nagpur', stdCode: '0712' },
    { name: 'Nashik', stdCode: '0253' },
    { name: 'Nellore', stdCode: '0861' },
    { name: 'Patna', stdCode: '0612' },
    { name: 'Puducherry (Pondicherry)', stdCode: '0413' },
    { name: 'Pune', stdCode: '020' },
    { name: 'Raipur', stdCode: '0771' },
    { name: 'Rajahmundry', stdCode: '0883' },
    { name: 'Rajkot', stdCode: '0281' },
    { name: 'Ranchi', stdCode: '0651' },
    { name: 'Rourkela', stdCode: '0661' },
    { name: 'Salem', stdCode: '0427' },
    { name: 'Siliguri', stdCode: '0353' },
    { name: 'Shimla', stdCode: '0177' },
    { name: 'Solapur', stdCode: '0217' },
    { name: 'Srinagar', stdCode: '0194' },
    { name: 'Surat', stdCode: '0261' },
    { name: 'Thiruvananthapuram (Trivandrum)', stdCode: '0471' },
    { name: 'Thrissur', stdCode: '0487' },
    { name: 'Tiruchirappalli (Trichy)', stdCode: '0431' },
    { name: 'Tirunelveli', stdCode: '0462' },
    { name: 'Tirupati', stdCode: '0877' },
    { name: 'Udaipur', stdCode: '0294' },
    { name: 'Ujjain', stdCode: '0734' },
    { name: 'Vadodara', stdCode: '0265' },
    { name: 'Varanasi', stdCode: '0542' },
    { name: 'Vellore', stdCode: '0416' },
    { name: 'Vijayawada', stdCode: '0866' },
    { name: 'Visakhapatnam (Vizag)', stdCode: '0891' },
    { name: 'Warangal', stdCode: '0870' },
    // Tier-2 / NCR / metro-satellite additions
    { name: 'Noida', stdCode: '0120' },
    { name: 'Greater Noida', stdCode: '0120' },
    { name: 'Navi Mumbai', stdCode: '022' },
    { name: 'Thane', stdCode: '022' },
    { name: 'Howrah', stdCode: '033' },
    { name: 'Bhilai', stdCode: '0788' },
    { name: 'Mira-Bhayandar', stdCode: '022' },
    { name: 'Vasai-Virar', stdCode: '0250' },
    { name: 'Panaji', stdCode: '0832' },
    { name: 'Shillong', stdCode: '0364' },
    { name: 'Imphal', stdCode: '0385' },
    { name: 'Agartala', stdCode: '0381' },
    { name: 'Aizawl', stdCode: '0389' },
    { name: 'Itanagar', stdCode: '0360' },
    { name: 'Gangtok', stdCode: '03592' },
    { name: 'Kohima', stdCode: '0370' },
    { name: 'Saharanpur', stdCode: '0132' },
    { name: 'Hisar', stdCode: '01662' },
    { name: 'Rohtak', stdCode: '01262' },
    { name: 'Panipat', stdCode: '0180' },
    { name: 'Karnal', stdCode: '0184' },
    { name: 'Ambala', stdCode: '0171' },
    { name: 'Anand', stdCode: '02692' },
    { name: 'Gandhinagar', stdCode: '079' },
    { name: 'Tirupur', stdCode: '0421' },
    { name: 'Thoothukudi (Tuticorin)', stdCode: '0461' },
    { name: 'Davanagere', stdCode: '08192' },
    { name: 'Bellary', stdCode: '08392' },
    { name: 'Gulbarga (Kalaburagi)', stdCode: '08472' },
    { name: 'Ujjain', stdCode: '0734' },
    { name: 'Sagar', stdCode: '07582' },
    { name: 'Satna', stdCode: '07672' },
    { name: 'Muzaffarpur', stdCode: '0621' },
    { name: 'Gaya', stdCode: '0631' },
    { name: 'Bhagalpur', stdCode: '0641' },
    { name: 'Bokaro', stdCode: '06542' },
    { name: 'Durg', stdCode: '0788' },
];

/**
 * Aliases mapping common geocoder / official / colloquial names to the canonical
 * `name` used in INDIAN_CITY_STD_CODES. Keys are normalized (see `normalizeCityName`).
 * Reverse-geocoders and IP services return a mix of old/new and short names, so we
 * normalize them here before matching.
 */
export const CITY_ALIASES: Record<string, string> = {
    bengaluru: 'Bangalore',
    'bengaluru urban': 'Bangalore',
    gurugram: 'Gurgaon (Gurugram)',
    gurgaon: 'Gurgaon (Gurugram)',
    prayagraj: 'Allahabad (Prayagraj)',
    allahabad: 'Allahabad (Prayagraj)',
    kochi: 'Kochi (Cochin)',
    cochin: 'Kochi (Cochin)',
    ernakulam: 'Kochi (Cochin)',
    malappuram: 'Manjeri',
    panaji: 'Panji',
    panjim: 'Panji',
    aizawl: 'Aizwal-I',
    margao: 'Margaon',
    trivandrum: 'Thiruvananthapuram (Trivandrum)',
    thiruvananthapuram: 'Thiruvananthapuram (Trivandrum)',
    pondicherry: 'Puducherry (Pondicherry)',
    puducherry: 'Puducherry (Pondicherry)',
    vizag: 'Visakhapatnam (Vizag)',
    visakhapatnam: 'Visakhapatnam (Vizag)',
    calicut: 'Kozhikode (Calicut)',
    kozhikode: 'Kozhikode (Calicut)',
    trichy: 'Tiruchirappalli (Trichy)',
    tiruchirapalli: 'Tiruchirappalli (Trichy)',
    tiruchirappalli: 'Tiruchirappalli (Trichy)',
    tuticorin: 'Thoothukudi (Tuticorin)',
    thoothukudi: 'Thoothukudi (Tuticorin)',
    tatanagar: 'Jamshedpur',
    kalaburagi: 'Gulbarga (Kalaburagi)',
    gulbarga: 'Gulbarga (Kalaburagi)',
    mysuru: 'Mysore',
    mangaluru: 'Mangalore',
    belagavi: 'Belgaum',
    hubballi: 'Hubli',
    'hubli-dharwad': 'Hubli',
    vadodara: 'Vadodara',
    baroda: 'Vadodara',
    bombay: 'Mumbai',
    'greater bombay': 'Mumbai',
    'new delhi': 'Delhi',
    'delhi ncr': 'Delhi',
    'national capital territory of delhi': 'Delhi',
    calcutta: 'Kolkata',
    madras: 'Chennai',
    pondy: 'Puducherry (Pondicherry)',
    'navi mumbai': 'Navi Mumbai',
    'greater noida': 'Greater Noida',
    'mira bhayandar': 'Mira-Bhayandar',
    'vasai virar': 'Vasai-Virar',
};

/** Normalize a city name for lookup: lowercase, strip parenthetical text & extra punctuation. */
const normalizeCityName = (raw: string): string =>
    raw
        .toLowerCase()
        .replace(/\(.*?\)/g, '') // drop "(Cochin)" etc.
        .replace(/[^a-z\s-]/g, '') // drop digits/punctuation
        .replace(/\s+/g, ' ')
        .trim();

/** A city in the merged index: SelectedCity plus the state (for disambiguation/UI). */
export type IndexedCity = SelectedCity & { state?: string };

/** "PERINTHALMANNA" -> "Perinthalmanna" (dataset names are ALL CAPS). */
const titleCase = (raw: string): string =>
    raw.toLowerCase().replace(/(^|[\s\-(])[a-z]/g, m => m.toUpperCase());

/** Dataset codes lack the leading zero ("80", "4933") — restore it for ONDC. */
const datasetToOndc = (stdCode: string): string =>
    toOndcCity(stdCode.startsWith('0') ? stdCode : `0${stdCode}`);

/**
 * Merged lookup: normalized name -> cities with that name (57 names repeat
 * across states, e.g. Aurangabad in Maharashtra and Bihar). Dataset entries
 * first; curated INDIAN_CITY_STD_CODES entries REPLACE same-name dataset
 * entries (keeping the dataset's state when available).
 */
const NORMALIZED_CITY_INDEX: Record<string, IndexedCity[]> = (() => {
    const index: Record<string, IndexedCity[]> = {};
    (STD_CODES_DATASET as { city: string; state: string; stdCode: string }[]).forEach(entry => {
        const key = normalizeCityName(entry.city);
        if (!key) return;
        const city: IndexedCity = {
            name: titleCase(entry.city),
            code: datasetToOndc(entry.stdCode),
            state: entry.state,
        };
        (index[key] = index[key] || []).push(city);
    });
    INDIAN_CITY_STD_CODES.forEach(entry => {
        const key = normalizeCityName(entry.name);
        const code = toOndcCity(entry.stdCode);
        const cities = index[key] || [];
        // Replace the dataset entry the curated one corrects (same code after
        // zero-restoration, else the first) — but KEEP same-name cities in
        // other states (e.g. Aurangabad exists in Maharashtra AND Bihar).
        const at = Math.max(0, cities.findIndex(c => c.code === code));
        const curated: IndexedCity = { name: entry.name, code, state: cities[at]?.state };
        cities.splice(at, cities.length ? 1 : 0, curated);
        index[key] = cities;
    });
    return index;
})();

const ALL_INDEXED_CITIES: IndexedCity[] = Object.values(NORMALIZED_CITY_INDEX).flat();

const MAX_SEARCH_RESULTS = 20;

/**
 * City-name search over the merged std-code index (no external API). Only
 * prefix matches — names must start with what the user typed.
 */
export const searchLocalCities = (query?: string | null): IndexedCity[] => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    return ALL_INDEXED_CITIES.filter(c => c.name.toLowerCase().startsWith(q))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, MAX_SEARCH_RESULTS);
};

/** Pick the entry matching the state hint (when a name exists in several states). */
const pickByState = (cities: IndexedCity[], stateHint?: string | null): IndexedCity => {
    if (stateHint && cities.length > 1) {
        const wanted = normalizeCityName(stateHint);
        const hit = cities.find(c => c.state && normalizeCityName(c.state) === wanted);
        if (hit) return hit;
    }
    return cities[0];
};

/**
 * Resolve a free-form city name (from a geocoder / India Post / user input) to
 * a city in the merged index, or null when unknown. `stateHint` disambiguates
 * duplicate names across states.
 */
export const matchCityByName = (
    rawName?: string | null,
    stateHint?: string | null
): IndexedCity | null => {
    if (!rawName) return null;
    const normalized = normalizeCityName(rawName);
    if (!normalized) return null;

    // 1) alias -> canonical name, then index lookup
    const aliasTarget = CITY_ALIASES[normalized];
    if (aliasTarget) {
        const aliased = NORMALIZED_CITY_INDEX[normalizeCityName(aliasTarget)];
        if (aliased?.length) return pickByState(aliased, stateHint);
    }

    // 2) direct normalized-name match
    const direct = NORMALIZED_CITY_INDEX[normalized];
    if (direct?.length) return pickByState(direct, stateHint);

    return null;
};

/**
 * Anchor city per state for names missing from the index entirely: the ONDC
 * `city` param must ALWAYS be a valid `std:` code, so an unknown town falls
 * back to a major city of its state. Values must resolve via matchCityByName.
 */
const STATE_ANCHOR_CITY: Record<string, string> = {
    'andhra pradesh': 'Visakhapatnam',
    'arunachal pradesh': 'Itanagar',
    assam: 'Guwahati',
    bihar: 'Patna',
    chandigarh: 'Chandigarh',
    chhattisgarh: 'Raipur',
    delhi: 'Delhi',
    'new delhi': 'Delhi',
    goa: 'Panji',
    gujarat: 'Ahmedabad',
    haryana: 'Gurgaon',
    'himachal pradesh': 'Shimla',
    'jammu and kashmir': 'Srinagar',
    jharkhand: 'Ranchi',
    karnataka: 'Bangalore',
    kerala: 'Kochi',
    ladakh: 'Srinagar',
    lakshadweep: 'Kochi',
    'madhya pradesh': 'Bhopal',
    maharashtra: 'Mumbai',
    manipur: 'Imphal',
    meghalaya: 'Shillong',
    mizoram: 'Aizwal-I',
    nagaland: 'Kohima',
    odisha: 'Bhubaneswar',
    orissa: 'Bhubaneswar',
    puducherry: 'Puducherry',
    punjab: 'Ludhiana',
    rajasthan: 'Jaipur',
    sikkim: 'Gangtok',
    'tamil nadu': 'Chennai',
    telangana: 'Hyderabad',
    tripura: 'Agartala',
    'uttar pradesh': 'Lucknow',
    uttarakhand: 'Dehradun',
    uttaranchal: 'Dehradun',
    'west bengal': 'Kolkata',
};

/**
 * Look up a state hint's anchor city, tolerating format variants a bare exact
 * match would miss ("NCT of Delhi", "Delhi, India"). Tries an exact normalized
 * match against STATE_ANCHOR_CITY first, then a word-boundary-safe substring
 * match on the full (multi-word) key — the word boundary matters so "Uttar
 * Pradesh"/"Andhra Pradesh"/etc. can't all collide on the shared word "pradesh".
 */
const matchStateAnchor = (stateHint: string): string | undefined => {
    const normalized = normalizeCityName(stateHint);
    if (!normalized) return undefined;
    if (STATE_ANCHOR_CITY[normalized]) return STATE_ANCHOR_CITY[normalized];
    const key = Object.keys(STATE_ANCHOR_CITY).find(k => new RegExp(`\\b${k}\\b`).test(normalized));
    return key ? STATE_ANCHOR_CITY[key] : undefined;
};

/**
 * Resolve ANY city selection to a SelectedCity whose `code` is ALWAYS a valid
 * `std:<STD_CODE>`: the city's own code when the name is in the merged index,
 * else its state's anchor-city code, else DEFAULT_CITY's. The user's city name
 * is kept for display either way.
 */
export const resolveCity = (name: string, stateHint?: string | null): SelectedCity => {
    const match = matchCityByName(name, stateHint);
    if (match) return { name: match.name, code: match.code };

    const anchorName = stateHint ? matchStateAnchor(stateHint) : undefined;
    const anchor = anchorName ? matchCityByName(anchorName) : null;
    if (!anchor) {
        // Two different unresolved locations both landing here would silently
        // collapse to the SAME code (DEFAULT_CITY's) — surfacing this makes
        // that collision diagnosable instead of just "the grid didn't refresh".
        console.warn('[resolveCity] could not resolve a real city — falling back to DEFAULT_CITY', {
            name,
            stateHint,
        });
    }
    return { name: name.trim(), code: anchor?.code || DEFAULT_CITY.code };
};

/** Reverse-geocode result → ONDC city. Outside India keeps the name and an empty code. */
export const cityFromGeocode = (opts: {
    cityName?: string | null;
    state?: string | null;
    countryCode?: string | null;
    countryName?: string | null;
}): SelectedCity => {
    const country = opts.countryCode || opts.countryName;
    if (country && !isIndiaCountry(country)) {
        return { name: (opts.cityName || opts.countryName || 'Outside India').trim(), code: '' };
    }
    const name = opts.cityName || opts.state;
    return name ? resolveCity(name, opts.state) : DEFAULT_CITY;
};
