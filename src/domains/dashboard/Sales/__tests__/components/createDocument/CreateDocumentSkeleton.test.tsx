import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import CreateDocumentSkeleton from '../../../components/createDocument/CreateDocumentSkeleton';

describe('CreateDocumentSkeleton', () => {
    it('renders the skeleton scaffold without throwing', () => {
        const { container } = render(<CreateDocumentSkeleton />);

        // Antd skeletons render with .ant-skeleton elements; assert presence.
        const skeletons = container.querySelectorAll('.ant-skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
