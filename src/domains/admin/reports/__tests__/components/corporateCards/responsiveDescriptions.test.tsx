import { render } from '@testing-library/react';
import { Descriptions } from 'antd';
import { describe, it, expect, beforeEach } from 'vitest';

import {
    DESCRIPTION_COLUMNS,
    FULL_ROW_SPAN,
} from '../../../components/corporateCards/transactionMeta';

const setViewport = (activeQueries: (query: string) => boolean) => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: (query: string) => ({
            matches: activeQueries(query),
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    });
};

const phone = () => setViewport(query => query.includes('max-width: 575px'));
const desktop = () => setViewport(query => query.includes('min-width: 768px'));
// A wide monitor: every min-width breakpoint up to xxl matches.
const wideDesktop = () => setViewport(query => /min-width: (576|768|992|1200|1600)px/.test(query));

const Subject = () => (
    <Descriptions column={DESCRIPTION_COLUMNS} size="small" bordered>
        <Descriptions.Item label="Transaction ID">CC000087</Descriptions.Item>
        <Descriptions.Item label="Reference No.">3259375297</Descriptions.Item>
        <Descriptions.Item label="Vendor Txn ID" span={FULL_ROW_SPAN}>
            16926197970
        </Descriptions.Item>
    </Descriptions>
);

const cellsPerRow = (container: HTMLElement) =>
    [...container.querySelectorAll('.ant-descriptions-row')].map(
        row => row.querySelectorAll('.ant-descriptions-item-content').length
    );

describe('Descriptions responsive column/span', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    /**
     * The reported bug: at column={2} a bordered Descriptions inside a phone-width drawer gave each
     * content cell ~40px, so "CC000087" rendered one character per line.
     */
    it('puts one field per row on a phone', () => {
        phone();
        const { container } = render(<Subject />);

        expect(cellsPerRow(container)).toEqual([1, 1, 1]);
    });

    it('keeps two fields per row on a desktop, with the full-row item spanning both', () => {
        desktop();
        const { container } = render(<Subject />);

        expect(cellsPerRow(container)).toEqual([2, 1]);
    });

    /**
     * Bug 31815: with only xs/sm/md set, antd fell back to 3 columns on lg/xl/xxl screens, squeezing the
     * 720px drawer until IDs and amounts wrapped mid-value. Wide screens must stay at two per row.
     */
    it('keeps two fields per row on a wide desktop, not the antd default of three', () => {
        wideDesktop();
        const { container } = render(<Subject />);

        expect(cellsPerRow(container)).toEqual([2, 1]);
    });
});
