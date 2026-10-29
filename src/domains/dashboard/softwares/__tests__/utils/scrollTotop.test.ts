/**
 * @file scrollTotop.test.ts
 * @description Unit tests for scrollTotop utility
 * Verifies:
 *  - Calls scrollTo(0, 0) on the element with id "myContainer" when it exists
 *  - Does nothing when the element is not found
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import scrollTotop from '../../utils/scrollTotop';

describe('scrollTotop', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('should call scrollTo(0, 0) on #myContainer when it exists', () => {
        const container = document.createElement('div');
        container.id = 'myContainer';
        document.body.appendChild(container);

        const scrollToMock = vi.fn();
        container.scrollTo = scrollToMock;

        scrollTotop();

        expect(scrollToMock).toHaveBeenCalledTimes(1);
        expect(scrollToMock).toHaveBeenCalledWith(0, 0);
    });

    it('should not throw when #myContainer does not exist', () => {
        expect(() => scrollTotop()).not.toThrow();
    });

    it('should not call scrollTo when #myContainer does not exist', () => {
        const getElementByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(null);

        scrollTotop();

        expect(getElementByIdSpy).toHaveBeenCalledWith('myContainer');
    });
});
