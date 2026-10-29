import { UserRole } from '@customtypes/general';
import { paths } from '@src/routes/paths';
import { RootState, store } from '@store/store';

// Labels that belong to the "More Services" section.
// Add new entries here when new services are moved under More Services.
export const MORE_SERVICES_LABELS = [
    'WhatsApp for Business',
    'eSign',
    'Turbo',
    'Global Business Setup',
    'Business Registration',
    'Domain & Hosting',
    'Logistics',
    'Compliance',
];

export function checkMoreServicesSidebar() {
    const { services } = (store.getState() as RootState).reducer.services;
    return MORE_SERVICES_LABELS.some(label =>
        services?.data?.some(
            item => item.label?.toLowerCase() === label.toLowerCase() && item.hasAccess
        )
    );
}

export function checkCorporateSidebar(key: string) {
    const { services } = (store.getState() as RootState).reducer.services;

    const hasAccess = services?.data?.find(
        item => item.label?.toLowerCase() === key?.toLowerCase().replace('-', ' ') && item.hasAccess
    );
    return hasAccess !== undefined;
}

// Whether the service matching `key` is flagged to live under the "More Services"
// grouping (and therefore should NOT appear as a top-level sidebar item).
export function checkEnableMoreService(key: string) {
    const { services } = (store.getState() as RootState).reducer.services;
    const match = services?.data?.find(
        item => item.label?.toLowerCase() === key?.toLowerCase().replace('-', ' ')
    );
    return Boolean(match?.enableMoreService);
}

// Whether there is at least one accessible service flagged `enableMoreService`
// (used to decide if the "More Services" sidebar entry should be shown).
export function hasMoreServices() {
    const { services } = (store.getState() as RootState).reducer.services;
    return Boolean(services?.data?.some(item => item.enableMoreService && item.hasAccess));
}


export function checkSidebarkAccess(key: string) {
    const { services } = (store.getState() as RootState).reducer.services;
    const hasAccess = services?.data?.find(
        item =>
            item?.serviceCategory?.toLowerCase() === key?.toLowerCase().replace('-', ' ') &&
            item?.hasAccess
    );

    return hasAccess !== undefined;
}

export function checkServiceAccess(serviceCategory: string, key: string) {
    const { services } = (store.getState() as RootState).reducer.services;

    const hasAccess = services?.data
        ?.find(
            item =>
                item?.serviceCategory?.toLowerCase() ===
                serviceCategory.toLowerCase().replace('-', ' ')
        )
        ?.services.find(service => service.hasAccess && service.service === key);
    return hasAccess !== undefined;
}

// This functions needs to be rewritten so that it will work properly
// export function checkSubServiceChildAccess(key: string) {
//     const { services } = (store.getState() as RootState).reducer.services;
//     const servicesArr: Service[] | undefined = services?.data
//         ?.filter(item => item.services.length > 0)
//         .map(item => item.services)
//         .flat();
//     const childServices: SubService[] | undefined = servicesArr?.map(item => item.services).flat();
//     const hasAccess = childServices?.filter(
//         service => service?.serviceProvider === key && service?.hasAccess
//     );

//     return hasAccess !== undefined;
// }

// export function checkSubServiceAccessCorporate(
//     serviceCategory: string,
//     serviceName: string,
//     checkMainLabel: boolean = false
// ) {
//     const { services } = (store.getState() as RootState).reducer.services;
//     const hasAccess = services?.data
//         ?.find(
//             item => item?.label.toLowerCase() === serviceCategory.toLowerCase().replace('-', ' ')
//         )
//         ?.services.find(
//             service =>
//                 service.hasAccess &&
//                 service.serviceProvider.toLowerCase() === serviceName.toLowerCase()
//         );
//     // if (checkMainLabel && !hasAccess) {
//     //     hasAccess = services?.data?.find(
//     //         item => item?.serviceCategory.toLowerCase() === serviceName.toLowerCase().replace('-', ' ')
//     //     )?.subServices.find(
//     //         service => service.hasAccess
//     //     );
//     // }
//     return hasAccess !== undefined;
// }

export function checkSubServiceAccessCorporate(
    serviceCategory: string,
    serviceName: string,
    checkMainLabel: boolean = false
) {
    const { services } = (store.getState() as RootState).reducer.services;
    // Find the main service category
    const mainService = services?.data?.find(
        item => item?.label?.toLowerCase() === serviceCategory.toLowerCase().replace('-', ' ')
    );

    let hasAccess: any;
    if (mainService?.subServices) {
        // Safely check subServices only if mainService exists and has subServices
        hasAccess = mainService?.subServices?.find(
            service =>
                service.hasAccess &&
                service.label?.toLowerCase() === serviceName.toLowerCase().replace(/-/g, ' ')
        );
    } else {
        // Safely check subServices only if mainService exists and has subServices
        hasAccess = mainService?.services?.find(
            service =>
                service.hasAccess &&
                service.label?.toLowerCase() === serviceName.toLowerCase().replace(/-/g, ' ')
        );
    }

    // If checkMainLabel is true and no access is found in subServices
    if (checkMainLabel && !hasAccess) {
        hasAccess = services?.data?.find(
            item =>
                item?.label?.toLowerCase() === serviceName.toLowerCase().replace('-', ' ') &&
                item.hasAccess
        );
    }

    return hasAccess !== undefined;
}

export const checkRole = (key: string) => {
    const { role } = (store.getState() as RootState).reducer.auth;
    if (role === UserRole.SYSTEM) return paths.systemUser[key];
    return '';
};

// export function checkServiceAccessCorporate(serviceCategory: string, key: string) {
//     const { services } = (store.getState() as RootState).reducer.services;
//     const hasAccess = services?.data
//         ?.find(
//             item =>
//                 item?.serviceCategory.toLowerCase() ===
//                 serviceCategory.toLowerCase().replace('-', ' ')
//         )
//         ?.services.find(service => service.hasAccess && service.serviceProvider === key);
//     return hasAccess !== undefined;
// }

export function checkServiceAccessAndSubService(key: string, subservice: string = '') {
    const { services } = (store.getState() as RootState).reducer.services;
    let hasAccess;
    if (subservice) {
        hasAccess = services?.data?.find(
            item =>
                item.label?.toLowerCase() === key?.toLowerCase().replace('-', ' ') && item.hasAccess
        );
        if (hasAccess && hasAccess?.subServices?.length > 0) {
            const data = hasAccess!.subServices.find(
                item =>
                    item.label?.toLowerCase() === subservice?.toLowerCase().replace('-', ' ') &&
                    item.hasAccess
            );
            // Only override parent access if the subService is explicitly listed.
            // If it's not in the list yet (e.g. new 'Visa' module), keep parent access.
            if (data !== undefined || hasAccess!.subServices.some(
                item => item.label?.toLowerCase() === subservice?.toLowerCase().replace('-', ' ')
            )) {
                hasAccess = data;
            }
        }
    } else {
        hasAccess = services?.data?.find(
            item =>
                item.label?.toLowerCase() === key?.toLowerCase().replace('-', ' ') && item.hasAccess
        );
    }
    return hasAccess !== undefined;
}

export function checkServiceAccessAndSubServiceAdmin(
    key: string,
    subservice: string = '',
    whitelabeledSubRoutes: string[] = []
) {
    const { services } = (store.getState() as RootState).reducer.services;
    let hasAccess;
    if (subservice) {
        hasAccess = services?.data?.find(
            item =>
                item?.serviceCategory?.toLowerCase() === key?.toLowerCase().replace('-', ' ') &&
                item.hasAccess
        );
        if (hasAccess && hasAccess?.services?.length > 0) {
            if (
                whitelabeledSubRoutes.includes(
                    subservice.toLowerCase().toLowerCase().split(' ').join('-')
                )
            ) {
                hasAccess = true;
            } else {
                // Update: Look for the subService inside the subServices array
                // Entries without a service name can't match a route — skip them instead of crashing.
                const data = hasAccess.services.find(service =>
                    service?.services?.some(
                        sub =>
                            sub?.service?.toLowerCase().replace('-', ' ') ===
                                subservice?.toLowerCase().replace('-', ' ') && sub.hasAccess
                    )
                );
                hasAccess = data;
            }
        }
    } else {
        hasAccess = services?.data?.find(
            item =>
                item?.serviceCategory?.toLowerCase() === key?.toLowerCase().replace('-', ' ') &&
                item.hasAccess
        );
    }
    return hasAccess !== undefined;
}
