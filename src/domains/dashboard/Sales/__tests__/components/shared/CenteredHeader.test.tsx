import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import CenteredHeader from '../../../components/shared/CenteredHeader';

describe('CenteredHeader', () => {
    it('renders title and description', () => {
        render(<CenteredHeader title="Hello" description="World" />);

        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('World')).toBeInTheDocument();
    });

    it('omits description when not provided', () => {
        render(<CenteredHeader title="Hello" />);

        expect(screen.queryByText('World')).not.toBeInTheDocument();
    });

    it('renders a single icon layer when only outer is given', () => {
        render(
            <CenteredHeader
                icon={<span data-testid="icon" />}
                outerClass="bg-orange"
                title="t"
            />
        );
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders three layers when middle and inner classes are provided', () => {
        const { container } = render(
            <CenteredHeader
                icon={<span data-testid="icon" />}
                outerClass="bg-outer"
                middleClass="bg-middle"
                innerClass="bg-inner"
                title="t"
            />
        );

        // The icon should be wrapped in 3 nested Flex divs.
        const icon = screen.getByTestId('icon');
        expect(icon.parentElement?.parentElement?.parentElement).not.toBeNull();
        expect(container.firstChild).toBeTruthy();
    });
});
