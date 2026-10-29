import { describe, expect, it } from 'vitest';

import { getCardEmployeeDropdownItems, getEmployeeDropdownItems } from '../navbarData';

type Item = { key?: string; type?: string };

const keysOf = (items: ReturnType<typeof getEmployeeDropdownItems>) =>
    (items ?? []).map(item => (item as Item)?.key).filter(Boolean);

const dividerCount = (items: ReturnType<typeof getEmployeeDropdownItems>) =>
    (items ?? []).filter(item => (item as Item)?.type === 'divider').length;

/**
 * Employee and sub-corporate are separate invites against one credential, so an employee may hold either,
 * both or neither — the menu is built from what the server said they hold, never from the session's role.
 */
describe.each([
    ['getEmployeeDropdownItems', getEmployeeDropdownItems],
    ['getCardEmployeeDropdownItems', getCardEmployeeDropdownItems],
] as const)('%s — the identities offered', (_name, build) => {
    it('offers neither switch to an employee holding only this identity', () => {
        const keys = keysOf(build(false, false));

        expect(keys).not.toContain('switch-corporate');
        expect(keys).not.toContain('switch-sub-corporate');
    });

    it('offers the sub-corporate switch to an employee invited as a member too', () => {
        expect(keysOf(build(false, true))).toContain('switch-sub-corporate');
    });

    it('offers the corporate switch to the account holder acting as their own employee', () => {
        expect(keysOf(build(true, false))).toContain('switch-corporate');
    });

    it('offers both where both were granted', () => {
        const keys = keysOf(build(true, true));

        expect(keys).toContain('switch-corporate');
        expect(keys).toContain('switch-sub-corporate');
    });

    // The divider belongs to the switch group. It used to be emitted alongside the corporate entry, so a
    // menu offering only the sub-corporate switch would have lost it and one offering both would have
    // drawn it between two entries that belong together.
    it('adds exactly one divider whenever a switch is offered, however many there are', () => {
        const withoutSwitches = dividerCount(build(false, false));

        expect(dividerCount(build(true, false))).toBe(withoutSwitches + 1);
        expect(dividerCount(build(false, true))).toBe(withoutSwitches + 1);
        expect(dividerCount(build(true, true))).toBe(withoutSwitches + 1);
    });

    it('keeps the switches ahead of everything else in the menu', () => {
        const keys = keysOf(build(true, true));

        expect(keys[0]).toBe('switch-corporate');
        expect(keys[1]).toBe('switch-sub-corporate');
    });
});
