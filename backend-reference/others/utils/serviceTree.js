const PLATFORM_SECTIONS = ["Dashboard", "Reports", "Need Help", "Settings"];
const CHILD_KEYS = ["subServices", "services"];
const CONFIG_FIELDS = ["service_with_plans", "service_without_plans"];

const parseTree = raw => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw !== "string") return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const childrenOf = node =>
    CHILD_KEYS.flatMap(candidate => (Array.isArray(node[candidate]) ? node[candidate] : []));

const labelOf = node => (typeof node.label === "string" ? node.label.trim() : "");

const accessKeyOf = node =>
    (typeof node.accessKey === "string" && node.accessKey.trim()) || null;

const isPlatformSection = node => PLATFORM_SECTIONS.includes(labelOf(node));

const listedKeysOf = config =>
    new Set(
        CONFIG_FIELDS.flatMap(field => (config && Array.isArray(config[field]) ? config[field] : []))
            .map(key => (typeof key === "string" ? key.trim() : ""))
            .filter(Boolean)
    );

const collectServiceNodes = (tree, listedKeys = null) => {
    const nodes = [];
    const seen = new Set();

    const walk = (list, path, group) => {
        list.forEach(node => {
            if (!node || typeof node !== "object") return;
            if (!path.length && isPlatformSection(node)) return;

            const label = labelOf(node);
            const nodePath = [...path, label];
            const children = childrenOf(node);
            if (children.length) {
                walk(children, nodePath, path.length ? group : label);
                return;
            }

            const accessKey = accessKeyOf(node);
            if (!label || !accessKey || (listedKeys && !listedKeys.has(accessKey)) || seen.has(accessKey)) return;
            seen.add(accessKey);
            nodes.push({
                nodeKey: accessKey,
                label,
                path: nodePath,
                group,
                accessKey,
                hasAccess: node.hasAccess === true,
                order: nodes.length,
            });
        });
    };

    walk(parseTree(tree), [], null);
    return nodes;
};

const findNode = (tree, nodeKey, listedKeys = null) =>
    collectServiceNodes(tree, listedKeys).find(node => node.nodeKey === nodeKey) || null;

module.exports = {
    PLATFORM_SECTIONS,
    CHILD_KEYS,
    CONFIG_FIELDS,
    parseTree,
    accessKeyOf,
    listedKeysOf,
    collectServiceNodes,
    findNode,
};
