import { describe, it, expect } from 'vitest';

import { clonePermissionSchema } from '../../schema/clonePermissionSchema';

const validate = async (values: Record<string, unknown>) => {
    try {
        await clonePermissionSchema.validate(values, { abortEarly: false });
        return null;
    } catch (err: any) {
        return err.errors as string[];
    }
};

describe('clonePermissionSchema', () => {
    describe('when both partners are chosen', () => {
        it('accepts the default as the source', async () => {
            expect(await validate({ fromPartnerId: 'default', toPartnerId: 1842 })).toBeNull();
        });

        it('accepts two different partners', async () => {
            expect(await validate({ fromPartnerId: 1830, toPartnerId: 1842 })).toBeNull();
        });
    });

    describe('when a partner is missing', () => {
        it('rejects a missing source', async () => {
            expect(await validate({ toPartnerId: 1842 })).toContain(
                'Please select a partner to clone from'
            );
        });

        it('rejects a missing target', async () => {
            expect(await validate({ fromPartnerId: 'default' })).toContain(
                'Please select a partner to clone to'
            );
        });

        it('rejects an empty-string source', async () => {
            expect(await validate({ fromPartnerId: '', toPartnerId: 1842 })).toContain(
                'Please select a partner to clone from'
            );
        });
    });

    describe('when the same partner is chosen twice', () => {
        it('rejects it', async () => {
            expect(await validate({ fromPartnerId: 1830, toPartnerId: 1830 })).toContain(
                'Source and target partner must be different'
            );
        });

        it('rejects it even when the ids differ in type', async () => {
            expect(await validate({ fromPartnerId: '1830', toPartnerId: 1830 })).toContain(
                'Source and target partner must be different'
            );
        });
    });
});
