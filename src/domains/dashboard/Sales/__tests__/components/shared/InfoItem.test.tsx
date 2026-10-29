import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import InfoItem from '../../../components/shared/InfoItem';

describe('InfoItem', () => {
    it('renders icon, title, and description', () => {
        render(
            <InfoItem
                icon={<span data-testid="icon" />}
                title="Heading"
                description="Body"
            />
        );

        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByText('Heading')).toBeInTheDocument();
        expect(screen.getByText('Body')).toBeInTheDocument();
    });
});
