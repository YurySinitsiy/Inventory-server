export const SALESFORCE = {
  clientId: process.env.SF_CLIENT_ID,
  clientSecret: process.env.SF_CLIENT_SECRET,
  redirectUri: process.env.SF_REDIRECT_URI, 
  tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
  instanceUrl: 'https://orgfarm-be6c10ad92-dev-ed.develop.my.salesforce.com', 
};
