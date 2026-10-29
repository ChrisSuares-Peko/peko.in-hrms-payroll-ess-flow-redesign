const MERCHANT_CATEGORIES = [
    { 
        category: 'Software & SaaS', 
        mccs: ['4816', '7372', '7375', '7379']
    },
    { 
        category: 'Financial Services & Fintech', 
        mccs: ['6010', '6011', '6012', '6051', '6211']
    },
    { 
        category: 'Lodging & Hotels', 
        mccs: ['3501', '3502', '3503', '3504', '7011']
    },
    { 
        category: 'Food & Beverage', 
        mccs: ['5411', '5812', '5813', '5814']
    },
    { 
        category: 'Health & Wellness', 
        mccs: ['8011', '8021', '8099', '7298']
    },
    { 
        category: 'Travel & Tourism', 
        mccs: ['4111', '4511', '4722', '7512']
    },
    { 
        category: 'Creative Arts & Design', 
        mccs: ['7333', '7338', '7392']
    },
    { 
        category: 'Renewable Energy & Sustainability', 
        mccs: ['4900', '5999']
    },
    { 
        category: 'Education & E-Learning', 
        mccs: ['8211', '8221', '8249', '8299']
    },
    { 
        category: 'Sports & Recreation', 
        mccs: ['5941', '7941', '7997', '7999']
    }
]

const MERCHANT_CATEGORY_NAMES = MERCHANT_CATEGORIES.map((c) => c.category)

const findMerchantCategory = (categoryName) =>
    MERCHANT_CATEGORIES.find((c) => c.category === categoryName) || null

module.exports = { MERCHANT_CATEGORIES, MERCHANT_CATEGORY_NAMES, findMerchantCategory }
