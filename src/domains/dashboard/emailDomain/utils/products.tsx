// This file defines a mapping of product names (peko key) to their corresponding React components
// It allows for dynamic rendering of product-specific components based on the product name

import Default from '../components/productDetails/Default';
import GoogleWorkspace from '../components/productDetails/GoogleWorkspace';

// productComponents object:
// - Field names: peko key (strings)
// - Values: React component references
export const productComponents = {
    google_workspace: GoogleWorkspace,
    microsoft_365: Default,
    default: Default,
};
