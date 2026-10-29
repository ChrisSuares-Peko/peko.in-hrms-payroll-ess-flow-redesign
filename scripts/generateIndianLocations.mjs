/**
 * Generates src/components/atomic/inputs/data/indianLocations.ts
 * from the @countrystatecity/countries package data.
 *
 * Run: node scripts/generateIndianLocations.mjs
 * Re-run whenever @countrystatecity/countries is updated.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_DATA = join(__dirname, '../node_modules/@countrystatecity/countries/dist/data/India-IN');
const OUT_FILE = join(__dirname, '../src/utils/indianLocations.ts');

const states = JSON.parse(readFileSync(join(PKG_DATA, 'states.json'), 'utf-8'));

// Known common-name aliases not present in the official dataset
const CITY_ALIASES = {
    KA: ['Bangalore'],
    KL: ['Kochi'],
};

const citiesByState = {};
for (const state of states) {
    const folderName = `${state.name.replace(/ /g, '_')}-${state.iso2}`;
    const citiesFile = join(PKG_DATA, folderName, 'cities.json');
    if (existsSync(citiesFile)) {
        const cities = JSON.parse(readFileSync(citiesFile, 'utf-8'));
        const aliases = CITY_ALIASES[state.iso2] ?? [];
        citiesByState[state.iso2] = [...aliases, ...cities.map(c => c.name)];
    }
}

const totalCities = Object.values(citiesByState).flat().length;

const lines = [
    `// Auto-generated — do NOT edit manually.`,
    `// To update: yarn generate:locations`,
    `// Source: @countrystatecity/countries (India-IN)`,
    `// States: ${states.length}, Cities: ${totalCities}`,
    ``,
    `export interface IndianState {`,
    `    iso2: string;`,
    `    name: string;`,
    `}`,
    ``,
    `export const INDIAN_STATES: IndianState[] = [`,
    ...states.map(s => `    { iso2: '${s.iso2}', name: '${s.name.replace(/'/g, "\\'")}' },`),
    `];`,
    ``,
    `export const CITIES_BY_STATE: Record<string, string[]> = {`,
    ...Object.keys(citiesByState).sort().map(iso2 => {
        const list = citiesByState[iso2].map(c => `'${c.replace(/'/g, "\\'")}'`).join(', ');
        return `    '${iso2}': [${list}],`;
    }),
    `};`,
    ``,
    `export const ALL_INDIA_CITIES: string[] = Object.values(CITIES_BY_STATE).flat();`,
    ``,
];


writeFileSync(OUT_FILE, lines.join('\n'), 'utf-8');
console.log(`✓ Generated indianLocations.ts — ${states.length} states, ${totalCities} cities`);
