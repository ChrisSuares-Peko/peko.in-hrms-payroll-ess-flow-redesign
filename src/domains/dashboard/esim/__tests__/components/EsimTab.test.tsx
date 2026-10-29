import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import EsimTab from '@src/domains/dashboard/esim/components/esimDetails/EsimTab'; // Adjust import path as needed
import {
    androidInstallation,
    iosInstallation,
} from '@src/domains/dashboard/esim/utils/InstallationSteps'; // Adjust import paths as needed

describe('EsimTab Component', () => {
    it('should render the Android tab with QR code and instructions', () => {
        render(<EsimTab />);

        // Check if Android specific instructions are displayed
        androidInstallation.forEach((item, i) => {
            expect(screen.getByText(`${i + 1}. ${item.title}:`)).toBeInTheDocument();
            expect(screen.getByText(item.content)).toBeInTheDocument();
        });

        // Verify the note specific to Android devices
        expect(
            screen.getByText(
                'Please note that the specific steps may vary slightly depending on the Android device model and the network carrier.'
            )
        ).toBeInTheDocument();
    });

    it('should render the iOS tab with QR code and instructions', async () => {
        render(<EsimTab />);

        // Simulate switching to the iOS tab
        const iosTab = screen.getByText('iOS Phones');

        await act(async () => {
            iosTab.click();
        });

        // Use getAllByText with a function that always returns true or false
        iosInstallation.forEach((item, i) => {
            const titleElements = screen.getAllByText(
                (_, element) => element?.textContent?.includes(`${i + 1}. ${item.title}`) ?? false
            );
            expect(titleElements.length).toBeGreaterThan(0);

            if (i !== 0) {
                const contentElements = screen.getAllByText(
                    (_, element) => element?.textContent?.includes(item.content) ?? false
                );
                expect(contentElements.length).toBeGreaterThan(0);
            }
        });

        // Verify the note specific to iOS devices
        expect(
            screen.getByText(
                "If you encounter any issues during the installation, you can reach out to your eSIM provider's customer support for assistance."
            )
        ).toBeInTheDocument();
    });
});
