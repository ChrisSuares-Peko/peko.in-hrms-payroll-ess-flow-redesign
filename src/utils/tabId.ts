import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'tabId';

// Kept in sessionStorage: it stays the same when this tab is refreshed, and is new for every tab.
const readOrCreateTabId = () => {
    try {
        const saved = window.sessionStorage.getItem(STORAGE_KEY);
        if (saved) return saved;
        const created = uuidv4();
        window.sessionStorage.setItem(STORAGE_KEY, created);
        return created;
    } catch {
        return uuidv4();
    }
};

export const TAB_ID = readOrCreateTabId();
