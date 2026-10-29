import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DocListItem from '../../../components/shared/DocListItem';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

vi.mock('../../../assets/icons/document-text.svg', () => ({ default: '/fallback.svg' }));

describe('DocListItem', () => {
    it('should render title and subTitle', () => {
        render(
            <DocListItem
                title="NDA Agreement"
                subTitle="Legal • 15 Jan 2024"
                status="Draft"
            />
        );

        expect(screen.getByText('NDA Agreement')).toBeInTheDocument();
        expect(screen.getByText('Legal • 15 Jan 2024')).toBeInTheDocument();
    });

    it('should show green Signed tag when status is Signed', () => {
        render(<DocListItem title="Doc" status="Signed" />);

        const tag = screen.getByText('Signed');
        expect(tag).toBeInTheDocument();
        expect(tag).toHaveStyle({ color: '#1a7f37' });
    });

    it('should show purple tag with status text when status is not Signed', () => {
        render(<DocListItem title="Doc" status="Draft" />);

        const tag = screen.getByText('Draft');
        expect(tag).toBeInTheDocument();
        expect(tag).toHaveStyle({ color: '#7c6fb0' });
    });

    it('should call onClick when row is clicked', () => {
        const onClick = vi.fn();
        render(<DocListItem title="Doc" status="Draft" onClick={onClick} />);

        fireEvent.click(screen.getByText('Doc'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should call onActionClick and not propagate when non-Signed tag is clicked', () => {
        const onClick = vi.fn();
        const onActionClick = vi.fn();
        render(
            <DocListItem
                title="Doc"
                status="Sent"
                onClick={onClick}
                onActionClick={onActionClick}
            />
        );

        fireEvent.click(screen.getByText('Sent'));

        expect(onActionClick).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('should show chevron when showChevron is true', () => {
        const { container } = render(
            <DocListItem title="Doc" status="Draft" showChevron />
        );

        expect(container.querySelector('.anticon-right')).toBeInTheDocument();
    });

    it('should not show chevron when showChevron is false', () => {
        const { container } = render(
            <DocListItem title="Doc" status="Draft" showChevron={false} />
        );

        expect(container.querySelector('.anticon-right')).not.toBeInTheDocument();
    });
});
