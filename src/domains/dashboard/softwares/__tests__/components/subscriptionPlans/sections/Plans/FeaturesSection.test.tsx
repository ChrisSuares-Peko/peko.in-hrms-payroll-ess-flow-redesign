/**
 * @file FeaturesSection.test.tsx
 * @description Unit tests for FeaturesSection component
 * Verifies:
 *  - Renders Features heading
 *  - Renders feature items when description exists
 *  - Renders empty state when no features
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import FeaturesSection from '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/FeaturesSection';

describe('FeaturesSection', () => {
    it('should render Features heading', () => {
        render(<FeaturesSection plan={{ description: ['Reporting', 'Analytics'] }} />);
        expect(screen.getByText('Features:')).toBeInTheDocument();
    });

    it('should render feature items when description exists', () => {
        render(<FeaturesSection plan={{ description: ['Reporting', 'Analytics'] }} />);
        expect(screen.getByText('Reporting')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should render empty state when no features', () => {
        render(<FeaturesSection plan={{ description: [] }} />);
        expect(screen.getByText('No features listed')).toBeInTheDocument();
    });
});
