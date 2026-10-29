const PLATFORM_SECTIONS = ["Dashboard", "Reports", "Need Help", "Settings"];
const CHILD_KEYS = ["subServices", "services"];

const childrenOf = node =>
    CHILD_KEYS.flatMap(candidate => (Array.isArray(node[candidate]) ? node[candidate] : []));

const labelOf = node => (typeof node.label === "string" ? node.label.trim() : "");

const accessKeyOf = node =>
    (typeof node.accessKey === "string" && node.accessKey.trim()) || null;

const walkLeaves = (tree, visit) => {
    const walk = (list, depth) => {
        (Array.isArray(list) ? list : []).forEach(node => {
            if (!node || typeof node !== "object") return;
            if (!depth && PLATFORM_SECTIONS.includes(labelOf(node))) return;

            const children = childrenOf(node);
            if (children.length) {
                walk(children, depth + 1);
                return;
            }
            const accessKey = accessKeyOf(node);
            if (accessKey) visit(node, accessKey);
        });
    };
    walk(tree, 0);
};

const collectLeafAccessKeys = tree => {
    const keys = new Set();
    walkLeaves(tree, (node, accessKey) => keys.add(accessKey));
    return keys;
};

const applyApprovalGate = (tree, blockedAccessKeys) => {
    walkLeaves(tree, (node, accessKey) => {
        if (blockedAccessKeys.has(accessKey)) node.hasAccess = false;
    });
    return tree;
};

const filterAccessibleServices = (accessKeys, tree, blockedAccessKeys) => {
    const leaves = collectLeafAccessKeys(tree);
    return (Array.isArray(accessKeys) ? accessKeys : []).filter(
        key => !(leaves.has(key) && blockedAccessKeys.has(key))
    );
};

module.exports = {
    PLATFORM_SECTIONS,
    collectLeafAccessKeys,
    applyApprovalGate,
    filterAccessibleServices,
};
