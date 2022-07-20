const express = require('express')
const app = express()
const axios = require('axios')
const qs = require('querystring');
const crypto = require('crypto')

const puppeteer = require('puppeteer');
const pw = require('playwright');

const port = 3001;


const connections_URL = ''
const login_URL = ''
const authorizeURL_Path = ''
const tokenURL_Path = ''


const redirect_uri = 'http://localhost:3001/callback'
//const scope = 'openid profile email projects accounting.transactions accounting.transactions.read accounting.contacts accounting.settings offline_access'
const scope = 'openid profile email accounting.transactions' //scopes for HQ -- add offline_access to get refresh token
const state = '3(#0/!~'   //random string --optional
const grant_type = 'authorization_code'
const verifier_str = 'prettyalex';   //random string not more than 255 chars(?)

var verifier = null;
var challenge = null;
var requestToken = null;

app.use(express.json())

var browser;
var last = true;

//Pixie Dust app
var creds = {
    client_id: "",
    email: "",
    password: "" 
}

function base64URLEncode(verifier_str) {
    return verifier_str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

//create code verifier
verifier = base64URLEncode(crypto.randomBytes(32));
//console.log('verifier....', verifier);

// create code challenge
challenge = base64URLEncode(sha256(verifier));


func();

async function func() {
    const browser = await pw.chromium.launch({ headless: false }); // or 'chromium', 'firefox' slowMo: 250 
    const context = await browser.newContext();
    await openAuthorizeURL(creds, context);  
}

async function openAuthorizeURL(params = {}, context) {

    var basta = {
        client_id: params.client_id,
        redirect_uri: redirect_uri,
        scope: scope,
        state: state,
        response_type: 'code',
        code_challenge: challenge,
        //acr_values: 'tenant:eee74689-233d-4415-9d02-09cdb9c0f1ef bulk_connect:true',
        code_challenge_method: 'S256',
    }

    if (Array.isArray(basta.scope)) {
        basta.scope = basta.scope.join(',');
    }

    var options = Object.assign({}, basta);
    var authorizationUri = authorizeURL_Path + '?' + qs.stringify(options);
    var page = await context.newPage();
   
    await page.goto(authorizationUri);

    await getAccessToken(params, page, last).catch((error) => {
       console.log('getAccessToken..', error);
    });
};

async function getAccessToken(params = {}, page) {   
    const email = await page.$('input[type=email]');
    await email.type(params.email);
    await page.waitFor(2000);
    const password = await page.$('input[type=password]');
    await password.type(params.password);
    await page.waitFor(2000);
    const submit = await page.$('button[name=button]', );
    await submit.click();
    await Promise.all([
        page.waitForNavigation(),
        page.once('load', () => console.log('Login..')),
    ])
    //you may need to manually click which tenant/s to auth or if there's a 2FA
    //automate if you like

    var resp = await page.waitForResponse(request => request.url().includes('/callback')).catch((error) => {
        console.log('page.waitForResponse error.... ' + error);
    });
  
    //Get the code value from the callback URL
    var searchParams = new URLSearchParams(resp.headers().location.replace(redirect_uri, ''));   
    var requestToken = searchParams.get('code');
    console.log('requestToken.... ' + requestToken);


    //Swap request token to access token  
    const swapToken = {
        code: requestToken,
        grant_type: grant_type,
        client_id: params.client_id,
        redirect_uri: redirect_uri,
        code_verifier: verifier
    };
    
    var access_token = null;
    var refresh_token = null; //you only get refresh_token if offline_access scope exists

    
    await axios.post(tokenURL_Path, qs.stringify(swapToken))
        .then(response => {
            console.log('Response....', response.data);

            access_token = response.data.access_token
            //refresh_token = response.data.refresh_token
            console.log('access_token: ' + access_token);
            // console.log('refresh_token: ' + refresh_token);
        })
        .catch((error) => {
            console.log('Get access token error.... ' + error);
        });

    //test get connections
    await axios.get(connections_URL, {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
        }) 
        .then(response => {
             console.log('Response....', response.data);
        })
        .catch((error) => {
            console.log('Get connections error.... ' + error);
        });    
}

app.listen(3001, (err) => {
    if (err) return console.error(err);

});