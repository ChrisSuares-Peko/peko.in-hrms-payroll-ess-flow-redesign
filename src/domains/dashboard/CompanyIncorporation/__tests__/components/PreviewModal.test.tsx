import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import PreviewModal from '../../components/PreviewModal';

describe('PreviewModal', () => {
    it('renders the title and content when visible', () => {
        render(
            <PreviewModal
                visible
                title="MOA Preview"
                content="Section one content"
                onClose={vi.fn()}
            />
        );
        expect(screen.getByText('MOA Preview')).toBeInTheDocument();
        expect(screen.getByText('Section one content')).toBeInTheDocument();
    });

    it('does not render content when not visible', () => {
        render(
            <PreviewModal visible={false} title="Hidden" content="secret text" onClose={vi.fn()} />
        );
        expect(screen.queryByText('secret text')).toBeNull();
    });

    it('calls onClose when the Close button is clicked', () => {
        const onClose = vi.fn();
        render(<PreviewModal visible title="T" content="c" onClose={onClose} />);
        // antd also renders an "X" close icon with aria-label "Close"; target the
        // footer button by its visible text instead to avoid ambiguity.
        fireEvent.click(screen.getByText('Close'));
        expect(onClose).toHaveBeenCalled();
    });
});
