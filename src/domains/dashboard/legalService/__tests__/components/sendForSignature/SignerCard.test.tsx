import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SignerCard, { type SignerValues } from '../../../components/sendForSignature/SignerCard';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ md: true }),
}));

const defaultValues: SignerValues = {
    name: '',
    email: '',
    phone: '',
    signingPolicy: 'QUICKSIGN',
};

const filledValues: SignerValues = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    signingPolicy: 'QUICKSIGN',
};

describe('SignerCard', () => {
    it('should render Signer label with correct index', () => {
        render(
            <SignerCard
                index={0}
                values={defaultValues}
                fieldsCount={0}
                isExpanded={false}
                onExpand={vi.fn()}
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText('Signer 1')).toBeInTheDocument();
    });

    it('should show form fields when expanded', () => {
        render(
            <SignerCard
                index={0}
                values={defaultValues}
                fieldsCount={0}
                isExpanded
                onExpand={vi.fn()}
                onChange={vi.fn()}
            />
        );

        expect(screen.getByPlaceholderText('Enter Recipient Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Phone Number')).toBeInTheDocument();
    });

    it('should not show form fields when collapsed', () => {
        render(
            <SignerCard
                index={0}
                values={defaultValues}
                fieldsCount={0}
                isExpanded={false}
                onExpand={vi.fn()}
                onChange={vi.fn()}
            />
        );

        expect(screen.queryByPlaceholderText('Enter Recipient Name')).not.toBeInTheDocument();
    });

    it('should call onExpand when header is clicked', () => {
        const onExpand = vi.fn();
        render(
            <SignerCard
                index={0}
                values={defaultValues}
                fieldsCount={0}
                isExpanded={false}
                onExpand={onExpand}
                onChange={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('Signer 1'));

        expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it('should call onChange with updated value when name input changes', () => {
        const onChange = vi.fn();
        render(
            <SignerCard
                index={0}
                values={defaultValues}
                fieldsCount={0}
                isExpanded
                onExpand={vi.fn()}
                onChange={onChange}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('Enter Recipient Name'), {
            target: { value: 'Jane Doe' },
        });

        expect(onChange).toHaveBeenCalledWith({ name: 'Jane Doe', email: '', phone: '', signingPolicy: 'QUICKSIGN' });
    });

    it('should show delete button when expanded, index > 0, and onDelete provided', () => {
        render(
            <SignerCard
                index={1}
                values={filledValues}
                fieldsCount={0}
                isExpanded
                onExpand={vi.fn()}
                onChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should not show delete button when index is 0', () => {
        const { container } = render(
            <SignerCard
                index={0}
                values={filledValues}
                fieldsCount={0}
                isExpanded
                onExpand={vi.fn()}
                onChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(container.querySelector('.anticon-delete')).not.toBeInTheDocument();
    });

    it('should show error border when hasError is true', () => {
        const { container } = render(
            <SignerCard
                index={0}
                values={defaultValues}
                fieldsCount={0}
                isExpanded={false}
                onExpand={vi.fn()}
                onChange={vi.fn()}
                hasError
            />
        );

        const card = container.querySelector('.border-\\[\\#FF3A3A\\]');
        expect(card).toBeInTheDocument();
    });

    it('should show error message below card when hasError is true', () => {
        render(
            <SignerCard
                index={0}
                values={defaultValues}
                fieldsCount={0}
                isExpanded={false}
                onExpand={vi.fn()}
                onChange={vi.fn()}
                hasError
            />
        );

        expect(screen.getByText('Error. Fill Details')).toBeInTheDocument();
    });

    it('should call onDelete when delete button is clicked', () => {
        const onDelete = vi.fn();
        render(
            <SignerCard
                index={1}
                values={filledValues}
                fieldsCount={0}
                isExpanded
                onExpand={vi.fn()}
                onChange={vi.fn()}
                onDelete={onDelete}
            />
        );

        const deleteIcon = screen.getByRole('img', { hidden: true });
        fireEvent.click(deleteIcon);

        expect(onDelete).toHaveBeenCalledTimes(1);
    });
});
