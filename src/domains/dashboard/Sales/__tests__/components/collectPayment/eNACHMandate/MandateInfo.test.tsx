import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import MandateInfo from '../../../../components/collectPayment/eNACHMandate/MandateInfo';

vi.mock('../../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../../components/shared/InfoItem', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

describe('MandateInfo', () => {
    it('renders sections and Go Back / Create Mandate actions', () => {
        const onBack = vi.fn();
        const onNext = vi.fn();
        render(<MandateInfo onBack={onBack} onNext={onNext} />);

        expect(screen.getByText('Supported Use Cases')).toBeInTheDocument();
        expect(screen.getByText('Requirements')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /go back/i }));
        fireEvent.click(screen.getByRole('button', { name: /create mandate/i }));
        expect(onBack).toHaveBeenCalled();
        expect(onNext).toHaveBeenCalled();
    });
});
