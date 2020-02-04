export default class AzureInstance {
    constructor(credentials) {
        // this.authority = 'https://login.microsoftonline.com/chatabox365.onmicrosoft.com';
        this.authority = 'https://login.microsoftonline.com/common';
        this.authorize_endpoint = '/oauth2/v2.0/authorize';
        this.redirect_uri = 'https://localhost:3000/login';
        this.token_endpoint ='/oauth2/v2.0/token';
        this.client_id = credentials.client_id;
        this.client_secret = credentials.client_secret;
        this.scope = credentials.scope;
        this.graphToken = {};
        this.chataboxToken = {};

        this.error_message = null;

        // function binding
        this.getConfig = this.getConfig.bind(this);
        this.setError = this.setError.bind(this);
        this.getError = this.getError.bind(this);
        this.setChataboxToken = this.setChataboxToken.bind(this);
        this.getChataboxToken = this.getChataboxToken.bind(this);
        this.setGraphToken = this.setGraphToken.bind(this);
        this.getGraphToken = this.getGraphToken.bind(this);
        this.getUserInfo = this.getUserInfo.bind(this);
    }

    getConfig(){
        return {
            authority: this.authority,
            authorize_endpoint: this.authorize_endpoint,
            token_endpoint: this.token_endpoint,
            client_id: this.client_id,
            client_secret: this.client_secret,
            redirect_uri: this.redirect_uri,
            scope: this.scope,
        }
    }

    setError(error) {
      this.error_message = error;
      console.log('setting error : ' + error);
    }
    getError() {
      console.log('getting error : ' + this.error_message);
      return this.error_message;
    }
    setChataboxToken(token){
        this.chataboxToken = token;
    }

    getChataboxToken(){
        return this.chataboxToken;
    }

    setGraphToken(token){
        this.graphToken = token;
    }

    getGraphToken(){
        return this.graphToken;
    }

    getUserInfo(): Promise {
      console.log("GETTING USER INFO");

        if (this.graphToken === undefined){
            throw new Error("Access token is undefined, please authenticate using Auth first");
        }

        return fetch("https://graph.microsoft.com/v1.0/me", {
                    headers: {
                        'Authorization': "Bearer " + this.graphToken.accessToken,
                    }
            }).then(response => {
                // return blob object
                return response.json()
            })
            .then(response => {
                // read blob object back to json
                return response
            }).catch(err => {
                // incase of error reject promise
                throw new Error(err);
            });
    }
}
