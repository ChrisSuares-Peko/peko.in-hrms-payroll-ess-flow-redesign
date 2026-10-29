import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import HowToUseTab from '../../components/HowToUseTab';

describe('HowToUseTab Component', () => {
    it('renders the component correctly', () => {
        render(<HowToUseTab />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays provided text correctly', () => {
        render(<HowToUseTab text="This is a test instruction." />);
        expect(screen.getByText(/this is a test instruction/i)).toBeInTheDocument();
    });

    it('renders empty content without crashing when no text is provided', () => {
        render(<HowToUseTab text="" />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });
});
