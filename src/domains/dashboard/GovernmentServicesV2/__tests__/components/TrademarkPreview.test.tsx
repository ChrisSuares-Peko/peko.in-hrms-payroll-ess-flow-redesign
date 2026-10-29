import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TrademarkPreview from '../../components/TrademarkPreview';
import { ApplicantDetailsValues } from '../../types';
import { EMPTY_VALUES } from '../../utils/trademarkForm';

const values: ApplicantDetailsValues = {
    ...EMPTY_VALUES,
    trademarkOwner: '555',
    entityType: 'Private Limited',
    salutation: 'Mr',
    authorizedPerson: 'John Doe',
    address: '12 MG Road',
    pincode: '560001',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    country: 'India',
    brand: 'Peko',
    language: 'English',
    mainGoodsOrService: 'Software',
    trademarkClass: '9',
    description: ['Computer software', 'Mobile apps'],
};

const onEdit = vi.fn();

describe('TrademarkPreview', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders applicant and trademark details with the resolved owner name', () => {
        render(<TrademarkPreview values={values} ownerName="Peko Pvt Ltd" logoFileName="logo.png" onEdit={onEdit} />);

        expect(screen.getByText('Peko Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('560001')).toBeInTheDocument();
        expect(screen.getByText('Peko')).toBeInTheDocument();
        expect(screen.getByText('Computer software, Mobile apps')).toBeInTheDocument();
        expect(screen.getByText('logo.png')).toBeInTheDocument();
    });

    it('hides transliteration/translation for English', () => {
        render(<TrademarkPreview values={values} ownerName="Peko" logoFileName="" onEdit={onEdit} />);

        expect(screen.queryByText('Transliteration of the Mark')).not.toBeInTheDocument();
        expect(screen.queryByText('Translation of the Mark')).not.toBeInTheDocument();
    });

    it('shows transliteration/translation for a non-English language', () => {
        render(
            <TrademarkPreview
                values={{ ...values, language: 'Hindi', transliterationOfMark: 'Peko-tr', translationOfMark: 'Peko-tl' }}
                ownerName="Peko"
                logoFileName=""
                onEdit={onEdit}
            />
        );

        expect(screen.getByText('Transliteration of the Mark')).toBeInTheDocument();
        expect(screen.getByText('Peko-tr')).toBeInTheDocument();
        expect(screen.getByText('Peko-tl')).toBeInTheDocument();
    });

    it('shows Used Since only when the trademark is in use', () => {
        const { rerender } = render(<TrademarkPreview values={values} ownerName="Peko" logoFileName="" onEdit={onEdit} />);
        expect(screen.getByText('No')).toBeInTheDocument();
        expect(screen.queryByText('Used Since')).not.toBeInTheDocument();

        rerender(
            <TrademarkPreview
                values={{ ...values, trademarkInUse: true, usedSince: '2024-01-01' }}
                ownerName="Peko"
                logoFileName=""
                onEdit={onEdit}
            />
        );
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('Used Since')).toBeInTheDocument();
        expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });

    it('shows placeholders for missing values and logo', () => {
        render(<TrademarkPreview values={values} ownerName="Peko" logoFileName="" onEdit={onEdit} />);

        expect(screen.getByText('No logo uploaded')).toBeInTheDocument();
        // associatedMarks is empty
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('calls onEdit with the section step index', () => {
        render(<TrademarkPreview values={values} ownerName="Peko" logoFileName="" onEdit={onEdit} />);

        const editButtons = screen.getAllByRole('button', { name: 'Edit' });
        expect(editButtons).toHaveLength(3);

        editButtons.forEach((button) => fireEvent.click(button));

        expect(onEdit).toHaveBeenNthCalledWith(1, 0);
        expect(onEdit).toHaveBeenNthCalledWith(2, 1);
        expect(onEdit).toHaveBeenNthCalledWith(3, 2);
    });
});
