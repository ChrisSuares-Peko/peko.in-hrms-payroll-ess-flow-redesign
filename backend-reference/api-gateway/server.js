const express = require("express");
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { createPublicKey, createHash } = require("crypto");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const { ROUTES } = require("./routes");
const { setupLogging } = require("./logging");
const { setupProxies } = require("./proxy");
const { setupAuth } = require("./auth");
const { setupRateLimit } = require("./ratelimit");
const { client: redisClient } = require("./redisCacheDataMethods");
const app = express();
const port = 3000;
const ISSUER = process.env.IDP_ISSUER;

app.set("trust proxy", 1);
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        httpOnly: true,
        maxAge: 86400000
    }
}));

app.get("/.well-known/openid-configuration", (req, res) => {
    res.json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/api/v1/user/authorize`,
        token_endpoint: `${ISSUER}/api/v1/user/token`,
        userinfo_endpoint: `${ISSUER}/api/v1/user/userinfo`,
        jwks_uri: `${ISSUER}/.well-known/jwks.json`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        id_token_signing_alg_values_supported: ["RS256"],
        subject_types_supported: ["public"],   // <-- added becoz of mcp implementation
        token_endpoint_auth_methods_supported: ["client_secret_post"],   //<-- added becoz of mcp implementation
        scopes_supported: [
            "openid",
            "profile",
            "email",
            "phone",
            "offline_access",
        ]
    });
});

const idpPublicJwk = createPublicKey(
    fs.readFileSync(path.join(__dirname, "keys", "rsa.key.pub"), "utf8")
).export({ format: "jwk" });
const idpJwkKid = createHash("sha256")
    .update(JSON.stringify(idpPublicJwk))
    .digest("base64url");
app.get("/.well-known/jwks.json", (req, res) => {
    res.json({ keys: [{ ...idpPublicJwk, use: "sig", alg: "RS256", kid: idpJwkKid }] });
});

setupLogging(app);
setupRateLimit(app);
app.use(cors());
app.use(setupAuth);
setupProxies(app, ROUTES);
const openApiDocument = yaml.load("openapi.yaml");

// Use the swagger-ui-express middleware to serve Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.listen(port, () => {
  console.log('env check', process.env.NODE_ENV)
  console.log(`API Gateway is running at http://localhost:${port}`);
});
