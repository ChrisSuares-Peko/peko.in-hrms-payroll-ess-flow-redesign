import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import WorkspaceList from '../../components/WorkspaceList';

describe('WorkspaceList component', () => {
    const mockProps = {
        name: 'Test Workspace',
        image: '/path/to/image.jpg',
        description: 'Test description',
    };

    it('renders correctly with given props', () => {
        render(<WorkspaceList {...mockProps} />);

        expect(screen.getByText(/Test Workspace/)).toBeInTheDocument();

        expect(screen.getByText(/Test description/)).toBeInTheDocument();

        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src', mockProps.image);
    });
});
