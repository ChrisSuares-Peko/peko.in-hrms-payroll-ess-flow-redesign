import { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { JSX } from 'react/jsx-runtime';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import WorksCard from '../../components/WorksCard'; // Adjust path accordingly

describe('WorksCard Component', () => {
    const mockData = {
        id: 123,
        workTitle: 'Test Work',
        workImg: 'https://example.com/image.jpg',
        workDescription: 'This is a test description.',
    };

    const renderWithRouter = (
        component: string | number | boolean | Iterable<ReactNode> | JSX.Element | null | undefined
    ) => render(<BrowserRouter>{component}</BrowserRouter>);

    it('should render correctly', () => {
        renderWithRouter(<WorksCard {...mockData} />);
        expect(screen.getByText('Test Work')).toBeInTheDocument();
        expect(screen.getByText('This is a test description.')).toBeInTheDocument();
    });

    it('should display the image when workImg is provided', () => {
        renderWithRouter(<WorksCard {...mockData} />);
        const image = screen.getByRole('img');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', mockData.workImg);
    });

    it('should display an empty state when workImg is not provided', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { workImg, ...mockDataWithoutImage } = mockData;
        renderWithRouter(<WorksCard workImg="" {...mockDataWithoutImage} />);
        expect(screen.getByText('No Preview Available')).toBeInTheDocument();
    });

    it('should have a link pointing to the correct work detail page', () => {
        renderWithRouter(<WorksCard {...mockData} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', `/details/${mockData.id}`);
    });
});
