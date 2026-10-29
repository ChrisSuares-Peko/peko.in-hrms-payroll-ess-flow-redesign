import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProfileField from '../../components/ProfileField';

const onChange = vi.fn();

const options = [
    { label: 'Kerala', value: 'KL' },
    { label: 'Karnataka', value: 'KA' },
];

describe('ProfileField', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the label with a required asterisk and a text input', () => {
        render(<ProfileField label="Name" value="Joseph" onChange={onChange} placeholder="e.g., Joseph" />);

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('*')).toBeInTheDocument();
        const input = screen.getByPlaceholderText('e.g., Joseph');
        expect(input).toHaveValue('Joseph');
    });

    it('calls onChange with the typed string value', () => {
        render(<ProfileField label="Name" value="" onChange={onChange} placeholder="Name here" />);

        fireEvent.change(screen.getByPlaceholderText('Name here'), { target: { value: 'Asha' } });

        expect(onChange).toHaveBeenCalledWith('Asha');
    });

    it('shows the error message and marks the input as errored', () => {
        const { container } = render(
            <ProfileField label="Email" value="bad" onChange={onChange} error="Invalid email" placeholder="email" />
        );

        expect(screen.getByText('Invalid email')).toBeInTheDocument();
        expect(container.querySelector('.ant-input-status-error')).not.toBeNull();
    });

    it('renders no error text or error status without an error', () => {
        const { container } = render(<ProfileField label="Email" value="" onChange={onChange} />);

        expect(container.querySelector('.ant-input-status-error')).toBeNull();
    });

    it('renders the suffix inside the input', () => {
        render(<ProfileField label="PAN" value="" onChange={onChange} suffix={<span>Verify-suffix</span>} />);

        expect(screen.getByText('Verify-suffix')).toBeInTheDocument();
    });

    it('renders a select with the default "Select <label>" placeholder', () => {
        const { container } = render(
            <ProfileField label="State" value="" onChange={onChange} isSelect options={options} />
        );

        expect(container.querySelector('.ant-select')).not.toBeNull();
        expect(screen.getByText('Select State')).toBeInTheDocument();
    });

    it('uses a custom placeholder on the select when provided', () => {
        render(
            <ProfileField label="State" value="" onChange={onChange} isSelect options={options} placeholder="Pick one" />
        );

        expect(screen.getByText('Pick one')).toBeInTheDocument();
        expect(screen.queryByText('Select State')).not.toBeInTheDocument();
    });

    it('shows the selected option label for a non-empty value', () => {
        render(<ProfileField label="State" value="KA" onChange={onChange} isSelect options={options} />);

        expect(screen.getByText('Karnataka')).toBeInTheDocument();
    });

    it('calls onChange with the option value when an option is picked', () => {
        const { container } = render(
            <ProfileField label="State" value="" onChange={onChange} isSelect options={options} />
        );

        fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
        fireEvent.click(screen.getByText('Kerala'));

        expect(onChange).toHaveBeenCalledWith('KL');
    });

    it('marks the select as errored when an error is passed', () => {
        const { container } = render(
            <ProfileField label="State" value="" onChange={onChange} isSelect options={options} error="Required" />
        );

        expect(container.querySelector('.ant-select-status-error')).not.toBeNull();
        expect(screen.getByText('Required')).toBeInTheDocument();
    });
});
