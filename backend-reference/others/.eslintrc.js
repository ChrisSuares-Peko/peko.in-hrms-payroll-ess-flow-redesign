module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node": true,
        "jest": true
    },
    "extends": ["eslint:recommended","plugin:jest/recommended"],
    "overrides": [
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "plugins": [
        "jest",
        "import"
    ],
    "settings": {
        "import/resolver": {
            "node": {
                "extensions": [".js", ".json"]
            }
        }
    },
    "rules": {
        "import/no-unresolved": ["error", { "commonjs": true }]
    }
}
