module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node" : true
    },
    "extends": "eslint:recommended",
    "overrides": [
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "plugins": [
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
