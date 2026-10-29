const normaliseLabel = (label) =>
    (typeof label === 'string' ? label.trim().toLowerCase() : '');

const nodeKey = (node) => {
    if (!node || typeof node !== 'object') return null;
    if (node.accessKey !== undefined && node.accessKey !== null && String(node.accessKey).trim() !== '') {
        return `key:${String(node.accessKey).trim()}`;
    }
    const label = normaliseLabel(node.label);
    return label ? `label:${label}` : null;
};

const hasIcon = (node) =>
    typeof node?.icon === 'string' && node.icon.trim() !== '';

const collectIcons = (services) => {
    const icons = new Map();
    if (!Array.isArray(services)) return icons;
    for (const service of services) {
        const key = nodeKey(service);
        if (!key) continue;
        if (!icons.has(key)) {
            icons.set(key, { icon: hasIcon(service) ? service.icon : null, subServices: new Map() });
        }
        const entry = icons.get(key);
        if (entry.icon === null && hasIcon(service)) entry.icon = service.icon;
        if (Array.isArray(service.subServices)) {
            for (const sub of service.subServices) {
                const subKey = nodeKey(sub);
                if (!subKey) continue;
                if (!entry.subServices.has(subKey) && hasIcon(sub)) {
                    entry.subServices.set(subKey, sub.icon);
                }
            }
        }
    }
    return icons;
};

const countIcons = (icons) => {
    let total = 0;
    let bytes = 0;
    for (const entry of icons.values()) {
        if (entry.icon) {
            total += 1;
            bytes += Buffer.byteLength(entry.icon, 'utf8');
        }
        for (const subIcon of entry.subServices.values()) {
            total += 1;
            bytes += Buffer.byteLength(subIcon, 'utf8');
        }
    }
    return { total, bytes };
};

const applyIcons = (targetServices, icons) => {
    const stats = { copied: 0, unchanged: 0, unmatched: 0 };
    if (!Array.isArray(targetServices)) {
        return { permissions: targetServices, stats };
    }

    const permissions = targetServices.map((service) => {
        if (!service || typeof service !== 'object') return service;

        const key = nodeKey(service);
        const source = key ? icons.get(key) : undefined;
        const next = { ...service };

        if (!source) {
            stats.unmatched += 1;
        } else if (source.icon) {
            if (next.icon === source.icon) stats.unchanged += 1;
            else {
                next.icon = source.icon;
                stats.copied += 1;
            }
        }

        if (Array.isArray(service.subServices)) {
            next.subServices = service.subServices.map((sub) => {
                if (!sub || typeof sub !== 'object') return sub;
                const subKey = nodeKey(sub);
                const subIcon = source && subKey ? source.subServices.get(subKey) : undefined;
                if (!subIcon) {
                    if (!source || !subKey || !source.subServices.has(subKey)) stats.unmatched += 1;
                    return sub;
                }
                if (sub.icon === subIcon) {
                    stats.unchanged += 1;
                    return sub;
                }
                stats.copied += 1;
                return { ...sub, icon: subIcon };
            });
        }

        return next;
    });

    return { permissions, stats };
};

const restoreIconsUnderMoreServices = (clonedServices, existingServices) => {
    if (!Array.isArray(clonedServices)) {
        return { permissions: clonedServices, preserved: 0 };
    }

    const existing = collectIcons(existingServices);
    let preserved = 0;

    const permissions = clonedServices.map((service) => {
        if (!service || typeof service !== 'object') return service;
        if (service.enableMoreService !== true) return service;

        const key = nodeKey(service);
        const entry = key ? existing.get(key) : undefined;
        const next = { ...service };

        if (entry && entry.icon) {
            next.icon = entry.icon;
            preserved += 1;
        }

        if (Array.isArray(service.subServices)) {
            next.subServices = service.subServices.map((sub) => {
                if (!sub || typeof sub !== 'object') return sub;
                const subKey = nodeKey(sub);
                const subIcon = entry && subKey ? entry.subServices.get(subKey) : undefined;
                if (!subIcon) return sub;
                preserved += 1;
                return { ...sub, icon: subIcon };
            });
        }

        return next;
    });

    return { permissions, preserved };
};

const copyIconsBetweenTrees = (sourceServices, targetServices) => {
    const icons = collectIcons(sourceServices);
    const available = countIcons(icons);
    const { permissions, stats } = applyIcons(targetServices, icons);
    return {
        permissions,
        sourceIconCount: available.total,
        sourceIconBytes: available.bytes,
        ...stats,
    };
};

module.exports = {
    collectIcons,
    applyIcons,
    copyIconsBetweenTrees,
    restoreIconsUnderMoreServices,
};
