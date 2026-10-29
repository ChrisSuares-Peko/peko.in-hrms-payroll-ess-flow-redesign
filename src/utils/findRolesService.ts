/* eslint-disable no-plusplus */
// hooks/useFindRolesService.ts
import { useState, useEffect } from 'react';

export const useFindRolesService = (data: any, serviceName: string, subCategory?: string) => {
    const [foundService, setFoundService] = useState<any>(null);

    useEffect(() => {
        const result = findRolesService(data, serviceName, subCategory);
        setFoundService(result);
    }, [data, serviceName, subCategory]);

    return foundService;
};

// utils/findRolesService.ts
export const findRolesService = (data: any, serviceName: string, subCategory?: string) => {
    let foundService = null;
    // `data` (the services list) is null/undefined until the services API call
    // resolves — a real race on first page load / hard refresh, not just a
    // theoretical case. Without this guard every caller crashes the whole
    // render tree on that first render (`Cannot read properties of undefined
    // (reading 'length')`), taking down everything above it too since nothing
    // wraps these pages in their own error boundary.
    if (!Array.isArray(data)) return foundService;
    for (let i = 0; i < data.length; i++) {
        if (data[i].services && Array.isArray(data[i].services)) {
            const serviceCategoryName = data[i].serviceCategory;
            for (let j = 0; j < data[i].services.length; j++) {
                const serviceCategory = data[i].services[j];
                if (serviceCategory.services && Array.isArray(serviceCategory.services)) {
                    for (let k = 0; k < serviceCategory.services.length; k++) {
                        const service = serviceCategory.services[k];
                        if (service.service === serviceName) {
                            if (!subCategory || subCategory === serviceCategoryName) {
                                foundService = service; // Save the service instead of directly calling setAccessPermission
                                return foundService; // Return the found service
                            }
                            // if (subCategory === serviceCategoryName) {
                            //     foundService = service; // Save the service instead of directly calling setAccessPermission
                            //     return foundService; // Return the found service
                            // }
                        }
                    }
                }
            }
        }
    }

    return foundService; // Return null if not found
};
