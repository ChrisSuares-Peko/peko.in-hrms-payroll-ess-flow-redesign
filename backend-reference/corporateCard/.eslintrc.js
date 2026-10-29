const path = require("path");
const { buildImportNoRestrictedPathsZones } = require(path.join(__dirname, "..", "eslint", "siblingImportZones.cjs"));

module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "jest": true,
        "node": true
    },
    "extends":  ["eslint:recommended","plugin:jest/recommended"],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "module"
            }
        }
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
        "import/no-restricted-paths": [
            "error",
            {
                "zones": buildImportNoRestrictedPathsZones("corporateCard")
            }
        ]
    }
}
