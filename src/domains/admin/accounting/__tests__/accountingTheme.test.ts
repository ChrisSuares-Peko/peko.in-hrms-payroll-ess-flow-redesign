import { describe, expect, it } from 'vitest';

import { accountingTheme } from '../config/accountingTheme';

const ANTD_BLUES = /^#(1677ff|4096ff|0958d9|e6f4ff|91caff|bae0ff|69b1ff|003eb3)$/i;

describe('the accounting portal theme', () => {
    it('gives links the brand red in every state, so nothing falls back to antd blue', () => {
        expect(accountingTheme.token).toMatchObject({
            colorLink: '#FF3A3A',
            colorLinkHover: '#FF4F4F',
            colorLinkActive: '#EA3639',
        });
    });

    it('tones info notes gray', () => {
        expect(accountingTheme.components?.Alert).toEqual({
            colorInfo: '#667085',
            colorInfoBg: '#F8FAFC',
            colorInfoBorder: '#E4E7EC',
        });
    });

    it('carries no antd blue anywhere', () => {
        const colours = JSON.stringify(accountingTheme).match(/#[0-9a-f]{6}\b/gi) || [];
        expect(colours.length).toBeGreaterThan(0);
        colours.forEach(colour => expect(colour).not.toMatch(ANTD_BLUES));
    });
});
