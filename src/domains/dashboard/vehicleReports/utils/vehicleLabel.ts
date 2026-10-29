import { SelectedVehicle } from '../types/index';

// Headline for a selected vehicle. Fleet vehicles lead with the registration number;
// a manually entered vehicle has no details until the form collects them.
export const vehicleHeadline = (vehicle: SelectedVehicle): string => {
    if (vehicle.vehicleNumber) return vehicle.vehicleNumber;
    const spec = [vehicle.manufacturer, vehicle.model, vehicle.variant].filter(Boolean).join(' ');
    return spec || 'New vehicle';
};

// Muted second line under the headline.
export const vehicleDescriptor = (vehicle: SelectedVehicle): string => {
    if (!vehicle.vehicleNumber && !vehicle.manufacturer) {
        return 'Not part of your fleet — enter the details below';
    }
    return [vehicle.manufacturer, [vehicle.model, vehicle.variant].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(' · ');
};
