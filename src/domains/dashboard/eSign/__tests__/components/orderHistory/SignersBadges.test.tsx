import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import SignersBadges from '../../../components/orderHistory/SignersBadges';
import { SignerInfo } from '../../../types';

describe('SignersBadges Component', () => {
    const mockSigners: SignerInfo[] = [
        {
            signer_name: 'John Doe',
            sequence: '',
            signer_id: '',
            document_id: '',
            page_number: [],
            signer_email: '',
            signer_mobile: '',
            signer_ref_id: '',
            signer_position: [],
            reference_doc_id: '',
        },
        {
            signer_name: 'Jane Smith',
            sequence: '',
            signer_id: '',
            document_id: '',
            page_number: [],
            signer_email: '',
            signer_mobile: '',
            signer_ref_id: '',
            signer_position: [],
            reference_doc_id: '',
        },
        {
            signer_name: 'Alice Johnson',
            sequence: '',
            signer_id: '',
            document_id: '',
            page_number: [],
            signer_email: '',
            signer_mobile: '',
            signer_ref_id: '',
            signer_position: [],
            reference_doc_id: '',
        },
        {
            signer_name: 'Bob Williams',
            sequence: '',
            signer_id: '',
            document_id: '',
            page_number: [],
            signer_email: '',
            signer_mobile: '',
            signer_ref_id: '',
            signer_position: [],
            reference_doc_id: '',
        }, // This should trigger the "more" badge
    ];

    it('renders the correct number of signers when less than or equal to 3', () => {
        render(<SignersBadges signers_info={mockSigners.slice(0, 3)} />);

        // Expect 3 signer badges
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();

        // Should NOT display the "more" badge
        expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('renders a "more" badge when signers exceed 3', () => {
        render(<SignersBadges signers_info={mockSigners} />);

        // Expect 3 displayed signer names
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();

        // The "..." badge should be rendered
        expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('truncates long signer names', () => {
        const longNameSigner: SignerInfo[] = [
            {
                sequence: '5',
                signer_id: 'signer-5',
                document_id: 'doc-5',
                page_number: ['5'],
                signer_name: 'Christopher Alexander Benedict',
                signer_email: 'chris@example.com',
                signer_mobile: '5556667777',
                signer_ref_id: 'ref-5',
                signer_position: ['Lawyer'],
                reference_doc_id: 'ref-doc-5',
            },
        ];

        render(<SignersBadges signers_info={longNameSigner} />);

        // Should truncate to first 15 characters + "..."
        expect(screen.getByText('Christopher Ale...')).toBeInTheDocument();
    });

    it('renders no signers when given an empty list', () => {
        render(<SignersBadges signers_info={[]} />);

        // No signers should be present
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
});
