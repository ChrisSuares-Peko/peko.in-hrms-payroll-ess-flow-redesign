const isNode = (node) => node && typeof node === 'object' && !Array.isArray(node);

const clonePermissionTree = (services, underMoreService = false) => {
    if (!Array.isArray(services)) return services;
    return services.map((service) => {
        if (!isNode(service)) return service;
        const copy = { ...service };
        const isMoreService = underMoreService || service.enableMoreService === true;
        if (isMoreService) {
            delete copy.icon;
        }
        if (Array.isArray(service.subServices)) {
            copy.subServices = clonePermissionTree(service.subServices, isMoreService);
        }
        return copy;
    });
};

const summarisePermissionTree = (services) => {
    const summary = { services: 0, subServices: 0, icons: 0, iconBytes: 0 };
    if (!Array.isArray(services)) return summary;

    const countIcon = (node) => {
        if (typeof node?.icon === 'string' && node.icon.trim() !== '') {
            summary.icons += 1;
            summary.iconBytes += Buffer.byteLength(node.icon, 'utf8');
        }
    };

    for (const service of services) {
        if (!isNode(service)) continue;
        summary.services += 1;
        countIcon(service);
        if (Array.isArray(service.subServices)) {
            for (const sub of service.subServices) {
                if (!isNode(sub)) continue;
                summary.subServices += 1;
                countIcon(sub);
            }
        }
    }

    return summary;
};

module.exports = {
    clonePermissionTree,
    summarisePermissionTree,
};
