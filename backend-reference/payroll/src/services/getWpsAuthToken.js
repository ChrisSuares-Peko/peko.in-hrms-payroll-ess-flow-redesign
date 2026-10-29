const { default: axios } = require("axios");
const baseUrl = "https://orvillestaging.luluone.com:8443";


exports.getWpsAuthToken = async () => {
    try {
        const apiUrl = `${baseUrl}/hbapi/v1_0/auth/token`;

        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        };

        const payload = {
            grant_type: 'password',
            client_id: 'peko',
            client_secret: 'REDACTED',
            scope: 'peko',
            username: 'lmpekouser',
            password: 'REDACTED',
        };
        const response = await axios.post(
            apiUrl,
            new URLSearchParams(payload).toString(),
            { headers }
        );


        console.log({ data: response?.data })
        const { code, message, token } = response.data;
        if (code === 200 && message == 'success') {
            const { access_token, token_type, expires_in, scope } = token;
            console.log("Access Token:", access_token);
            console.log("Token Type:", token_type);
            console.log("Expires In:", expires_in);
            console.log("Scope:", scope);
            return access_token
        } else {
            return false
        }
    } catch (error) {
        console.error("Request Error:", error.message);
        return false
    }
};