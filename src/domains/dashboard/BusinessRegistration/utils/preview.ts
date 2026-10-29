import { EntityType } from '../types';

// Flow-preview entities: the screens are built but nothing is wired to the
// filing partner yet, so the form renders, ticks documents and navigates
// freely — no step validation, no document API. The structure card also shows
// without a vendor catalog row. Remove an entity from this set once its vendor
// flow is confirmed and wired.
export const PREVIEW_ENTITIES = new Set<EntityType>();

export const isPreviewEntity = (entityType?: EntityType | string) =>
    PREVIEW_ENTITIES.has(entityType as EntityType);
