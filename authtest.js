const { DISCOGS_CONSUMER_KEY, DISCOGS_CONSUMER_SECRET, DISCOGS_USER_AGENT } = require('./config');
const axios = require('axios');
const OAuth = require('oauth-1.0a');

const discogsTokenRequestUrl = 'https://api.discogs.com/oauth/request_token';

const oauth = OAuth({
  consumer: { key: DISCOGS_CONSUMER_KEY, secret: DISCOGS_CONSUMER_SECRET }
});

// signature_method: 'PLAINTEXT', this is default

const request_data = {
  url: discogsTokenRequestUrl,
  method: 'GET'
}

const authorized = oauth.authorize(request_data);
// console.log(authorized);


const oauthHeader = oauth.toHeader(authorized);

// console.log(oauthHeader);

const requestConfig = {
  // url: discogsTokenRequestUrl,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': oauthHeader.Authorization,
    'User-Agent': DISCOGS_USER_AGENT
  }
}
let data;

axios.get(discogsTokenRequestUrl, requestConfig)
      .then(resp => {
        data = resp.data;
        const [tokenkv, secretkv] = data.split('&');
        const token = tokenkv.split('=')[1];
        const secret = secretkv.split('=')[1];
        console.log(token);
        console.log(secret);
      })
      .catch(e => {
        console.log(e);
      });

// console.log(response);