import { readFileSync } from 'fs';
import { join } from 'path';

import { describe, it, expect } from 'vitest';

/**
 * `kycStage` GATES the cardholder dashboard, and `kybStage` gates the admin one. Persisting the slice that
 * holds them means a stale 'verified' is restored from localStorage and the gate is skipped for someone whose
 * verification is still pending — which is how the admin People table and the cardholder view came to report
 * different KYC states for the same person.
 *
 * Asserted against the source text rather than the store module: importing the store pulls in every slice,
 * redux-persist and its storage engine, which is a lot of machinery for one list. The regression this guards
 * is someone adding one line back to the whitelist, and that is exactly what this reads.
 */
const storeSource = readFileSync(join(process.cwd(), 'src/store/store.ts'), 'utf8');

const whitelist = () => {
    const match = storeSource.match(/whitelist:\s*\[([\s\S]*?)\]/);
    if (!match) throw new Error('Could not find the redux-persist whitelist in src/store/store.ts');
    return match[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith("'"))
        .map(line => line.replace(/^'|',?$/g, ''));
};

describe('redux-persist whitelist', () => {
    // Guards the parse itself — a broken regex would make every assertion below vacuously pass.
    it('reads a plausible whitelist out of the store', () => {
        const entries = whitelist();

        expect(entries.length).toBeGreaterThan(5);
        expect(entries).toContain('auth');
    });

    it('does not persist the corporateCards slice', () => {
        expect(whitelist()).not.toContain('corporateCards');
    });
});
