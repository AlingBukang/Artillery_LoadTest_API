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
// const scope = 'openid profile email projects accounting.transactions accounting.transactions.read accounting.contacts accounting.settings offline_access'
const scope = 'openid profile email practicemanager offline_access'
const state = '3(#0/!~'
const grant_type = 'authorization_code'
const verifier_str = 'prettyalex';

app.use(express.json())

var browser;
var last = true;

var creds_prd = {
    client_id: "",
    email: "",  //
    password: ""
}

//create code verifier
function base64URLEncode(verifier_str) {
    return verifier_str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
var verifier = base64URLEncode(crypto.randomBytes(32));
console.log('verifier....', verifier);

// create code challenge
function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}
var challenge = base64URLEncode(sha256(verifier));

func();

async function func() {
    const browser = await pw.chromium.launch({ headless: false }); // or 'chromium', 'firefox' slowMo: 250 
    const context = await browser.newContext();
    await openAuthorizeURL(creds_prd, context);  //change creds here
}

async function openAuthorizeURL(params = {}, context) {

    var basta = {
        client_id: params.client_id,
        redirect_uri: redirect_uri,
        scope: scope,
        state: state,
        response_type: 'code',
        code_challenge: challenge,
        code_challenge_method: 'S256'
        //acr_values: 'tenant:5d04e072-3f3e-4736-b128-a2fa1f671327 bulk_connect:true',
    }

    if (Array.isArray(basta.scope)) {
        basta.scope = basta.scope.join(',');
    }

    var options = Object.assign({}, basta + 'profile email');
    var authorizationUri = authorizeURL_Path + '?' + qs.stringify(options);
    //console.log('function authorizationUri.....', authorizationUri);
    //console.log("Check Scopes...... " + options);
    var page = await context.newPage();
   
    await page.goto(authorizationUri);

    // await login(params, page).catch((error) => {
    //     console.log('Login and consent..', error);
    // });

    await loginAndConsent(params, page, last).catch((error) => {
       console.log('loginAndConsent..', error);
    });
};

async function login(params, page) {
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
    const access = await page.$('button[value="yes"]', );
    await access.click();

    // await Promise.all([
    //     page.waitForNavigation(),
    //     page.once('consent', () => console.log('Consent..')),
    // ])
    // //await page.waitFor(2000);
    const access2 = await page.$('button[name="hasApproved"]', );
    // const access2 = await page.$('button[value="true"]', );
    await access2.click();
}

async function loginAndConsent(params = {}, page) {
    
    await login(params, page).catch((error) => {
        console.log('Login and consent..', error);
    });
    
    const resp = await page.waitForResponse(request => request.url().includes('/callback')).catch((error) => {
        console.log('page.waitForResponse error.... ' + error);
    });
    //console.log(resp.headers().location);
    const searchParams = new URLSearchParams(resp.headers().location.replace(redirect_uri, ''));
    const code = searchParams.get('code');
    console.log('code.... ' + code);
    
    var tokens = null;
    const requestToken = searchParams.get('code');

    const swapToken = {
        code: requestToken,
        grant_type: grant_type,
        client_id: params.client_id,
        redirect_uri: redirect_uri,
        code_verifier: verifier
    };

    var access_token = null;
    var refresh_token = null;

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