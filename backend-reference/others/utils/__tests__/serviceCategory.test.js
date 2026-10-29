const { categoryForAccessKey } = require('../serviceCategory')
const operatorsData = require('../operatorsData.json')

describe('categoryForAccessKey', () => {
    it('resolves corporate cards, the operator row that carries no serviceCategory', () => {
        expect(categoryForAccessKey('corporate_cards')).toBe('Corporate Cards')
    })

    it('resolves an ordinary service from the same catalogue', () => {
        expect(categoryForAccessKey('workspace')).toBe('Office Address')
    })

    it('tolerates surrounding whitespace on a stored accessKey', () => {
        expect(categoryForAccessKey('  corporate_cards  ')).toBe('Corporate Cards')
    })

    it('returns null for an unknown access key so the caller can fall back', () => {
        expect(categoryForAccessKey('no_such_service')).toBeNull()
    })

    it.each([undefined, null, ''])('returns null for %p rather than throwing', (value) => {
        expect(categoryForAccessKey(value)).toBeNull()
    })

    it('never returns an empty string, which would read as a blank receipt row', () => {
        Object.keys(operatorsData).forEach((name) => {
            const entry = operatorsData[name]
            if (!entry || !entry.accessKey) return
            const resolved = categoryForAccessKey(entry.accessKey)
            expect(resolved === null || resolved.length > 0).toBe(true)
        })
    })
})

describe('the operator catalogue backing the receipt category', () => {
    it('carries a corporate cards entry, without which the receipt reads Other', () => {
        expect(operatorsData.corporateCards).toEqual({
            accessKey: 'corporate_cards',
            category: 'Corporate Cards',
            type: 'Corporate Cards',
        })
    })

    it('gives every catalogued accessKey a category', () => {
        const missing = Object.keys(operatorsData).filter((name) => {
            const entry = operatorsData[name]
            return entry && entry.accessKey && !entry.category
        })
        expect(missing).toEqual([])
    })
})
