import Common from '@domains/admin/assets/icons/Common.svg';
import { store, RootState } from '@store/store';

import serviceIcons from './servicesIcons';

export const getPathFromLabel = (label: string) => {
    if (!label) return '';

    return label.toLowerCase().split(' ').join('-');
};

export function getServiceAccessList(serviceCategory: string) {
    const { services } = (store.getState() as RootState).reducer.services;

    let sectionServices = services?.data
        ?.find(
            item =>
                item?.serviceCategory.toLowerCase() ===
                serviceCategory.toLowerCase().replace('-', ' ')
        )
        ?.services.filter(service => service.hasAccess);

    sectionServices = sectionServices?.map(cat => {
        let accessibleServices = cat?.services!.map(service => ({
            ...service,
            icon: serviceIcons?.[serviceCategory]?.[service.service] || Common,
        }));
        accessibleServices = accessibleServices.filter(service => service.hasAccess);
        accessibleServices.sort((a, b) => {
            if (a.service.toLowerCase() < b.service.toLowerCase()) return -1;
            if (a.service.toLowerCase() > b.service.toLowerCase()) return 1;
            return 0;
        });
        return {
            ...cat,
            services: accessibleServices,
        };
    });

    if (sectionServices?.length)
        sectionServices.sort((a, b) => {
            if (a!.category!.toLowerCase() < b!.category!.toLowerCase()) return -1;
            if (a!.category!.toLowerCase() > b!.category!.toLowerCase()) return 1;
            return 0;
        });

    return sectionServices || [];
}
