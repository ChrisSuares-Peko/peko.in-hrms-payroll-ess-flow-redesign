import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import InfoItem from '../../../components/shared/InfoItem';

describe('InfoItem', () => {
    it('renders icon, title and description', () => {
        render(
            <InfoItem
                icon={<span data-testid="ii-icon" />}
                title="Fast"
                description="Works instantly"
            />
        );

        expect(screen.getByTestId('ii-icon')).toBeInTheDocument();
        expect(screen.getByText('Fast')).toBeInTheDocument();
        expect(screen.getByText('Works instantly')).toBeInTheDocument();
    });
});
