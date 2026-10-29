import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CenteredHeader from '../../../components/shared/CenteredHeader';

describe('CenteredHeader', () => {
    it('renders title and description', () => {
        render(<CenteredHeader title="Hello" description="World" />);
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('World')).toBeInTheDocument();
    });

    it('renders the icon when provided', () => {
        render(<CenteredHeader title="With icon" icon={<span data-testid="h-icon" />} />);
        expect(screen.getByTestId('h-icon')).toBeInTheDocument();
    });

    it('omits description block when description is missing', () => {
        render(<CenteredHeader title="Only title" />);
        expect(screen.queryByText('Desc')).not.toBeInTheDocument();
    });
});
