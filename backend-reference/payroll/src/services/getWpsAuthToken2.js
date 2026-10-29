const baseUrl = "https://orvillestaging.luluone.com:8443";
const { default: axios } = require("axios");


exports.getWpsAuthToken2 = async () => {
    try {
        const apiUrl = `${baseUrl}/hbapi/v1_0/auth/token`;
        // const apiUrl = `https://apimgmtuat.luluone.com/gvam/tenants/oauth/token`;


        let config = {
            method: 'post',
            url: apiUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: new URLSearchParams({
                grant_type: 'password',
                client_id: 'peko',
                client_secret: 'REDACTED',
                scope: 'peko',
                username: 'lmpekouser',
                password: 'REDACTED',
            }).toString()
        };
        console.log({ config })
        const response = await axios(config);

        console.log({ data: response?.data });
        const { code, message, token } = response.data;
        if (code === 200 && message === 'success') {
            const { access_token, token_type, expires_in, scope } = token;
            console.log({ access_token, token_type, expires_in, scope })
            return access_token;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Request Error:", error.message);
        return false;
    }
};