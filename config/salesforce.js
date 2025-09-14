export const SALESFORCE = {
  clientId: process.env.SF_CLIENT_ID,
  clientSecret: process.env.SF_CLIENT_SECRET,
  username: process.env.SF_SERVICE_USER,
  password: process.env.SF_SERVICE_PASSWORD + process.env.SF_SERVICE_SECURITY_TOKEN,
  redirectUri: process.env.SF_REDIRECT_URI, 
  loginUrl: 'https://login.salesforce.com',
  tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
  instanceUrl: 'https://orgfarm-be6c10ad92-dev-ed.develop.my.salesforce.com', 
};
