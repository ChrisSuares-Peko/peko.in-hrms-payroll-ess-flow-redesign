import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SchedulerCard from '../../components/SchedulerCard';
import UseShedulerData from '../../hooks/UseShedulerData';

vi.mock('../../hooks/UseShedulerData');

const mockStore = configureStore();
const store = mockStore({});

const mockUseShedulerData = {
    validateAddEmail: vi.fn(),
    validateAndAddEmail: vi.fn(),
    handleInputChange: vi.fn(),
    handleSwitchChange: vi.fn(),
    isValidEmail: vi.fn(),
    handleTagClose: vi.fn(),
    handleTimeChange: vi.fn(),
    handleWeekChange: vi.fn(),
    active: true,
    timeVal: '10:00 AM',
    inputValue: '',
    values: [],
    WeekVal: 'Monday',
};

beforeEach(() => {
    vi.clearAllMocks();
    (UseShedulerData as unknown as any).mockReturnValue(mockUseShedulerData);
});

describe('SchedulerCard Component', () => {
    const mockProps = {
        email: ['test@example.com'],
        isActive: true,
        scheduledTime: '10:00 AM',
        title: 'Weekly Scheduler',
        scheduledDay: 'Monday',
        handleUpdateBtn: vi.fn(),
    };

    it('renders the component title correctly', () => {
        render(
            <Provider store={store}>
                <SchedulerCard {...mockProps} />
            </Provider>
        );

        expect(screen.getByText('Weekly Scheduler')).toBeInTheDocument();
    });

    it('toggles the switch correctly', () => {
        render(
            <Provider store={store}>
                <SchedulerCard {...mockProps} />
            </Provider>
        );

        const toggleSwitch = screen.getByRole('switch');
        expect(toggleSwitch).toBeChecked();

        fireEvent.click(toggleSwitch);
        expect(mockUseShedulerData.handleSwitchChange).toHaveBeenCalled();
    });

    it('calls handleUpdateBtn when clicking Update', () => {
        render(
            <Provider store={store}>
                <SchedulerCard {...mockProps} />
            </Provider>
        );

        const updateButton = screen.getByRole('button', { name: /update/i });
        fireEvent.click(updateButton);

        expect(mockUseShedulerData.validateAndAddEmail).toHaveBeenCalled();
    });

    it('disables the Update button when inactive', () => {
        render(
            <Provider store={store}>
                <SchedulerCard {...mockProps} isActive={false} />
            </Provider>
        );

        expect(screen.getByRole('button', { name: /update/i })).toBeDisabled();
    });
});
