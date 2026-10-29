import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MyTemplates from '../../../components/landingPage/MyTemplates';
import type { MyTemplate } from '../../../types';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

const mockTemplates: MyTemplate[] = [
    { id: '1', title: 'My Custom NDA', subTitle: 'Legal', iconKey: 'nda' },
    { id: '2', title: 'My Employment Doc', subTitle: 'HR', iconKey: 'employment' },
];

describe('MyTemplates', () => {
    it('should render all templates', () => {
        render(<MyTemplates templates={mockTemplates} />);

        expect(screen.getByText('My Custom NDA')).toBeInTheDocument();
        expect(screen.getByText('My Employment Doc')).toBeInTheDocument();
    });

    it('should render subTitle for each template', () => {
        render(<MyTemplates templates={mockTemplates} />);

        expect(screen.getByText('Legal')).toBeInTheDocument();
        expect(screen.getByText('HR')).toBeInTheDocument();
    });

    it('should show empty state when no templates', () => {
        render(<MyTemplates templates={[]} />);

        expect(screen.getByText('No templates saved yet')).toBeInTheDocument();
    });

    it('should call onViewAll when View all is clicked', () => {
        const onViewAll = vi.fn();
        render(<MyTemplates templates={mockTemplates} onViewAll={onViewAll} />);

        fireEvent.click(screen.getByRole('button', { name: /view all/i }));

        expect(onViewAll).toHaveBeenCalledTimes(1);
    });

    it('should call onUseTemplate with the correct template when Use is clicked', () => {
        const onUseTemplate = vi.fn();
        render(<MyTemplates templates={mockTemplates} onUseTemplate={onUseTemplate} />);

        const useButtons = screen.getAllByRole('button', { name: /use/i });
        fireEvent.click(useButtons[0]);

        expect(onUseTemplate).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it('should render My Templates heading', () => {
        render(<MyTemplates templates={mockTemplates} />);

        expect(screen.getByText('My Templates')).toBeInTheDocument();
    });
});
