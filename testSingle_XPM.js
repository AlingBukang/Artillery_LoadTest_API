const express = require('express')
const app = express()
const axios = require('axios')
const qs = require('querystring');

const puppeteer = require('puppeteer');
const pw = require('playwright');
//const client_id = "";
//const client_secret = "";

const port = 3001;

const connections_URL = ''
const login_URL = ''
const authorizeURL_Path = ''
const tokenURL_Path = ''

const redirect_uri = 'http://localhost:3001/callback'
const scope = "openid accounting.settings offline_access"
const state = '3(#0/!~'
const grant_type = 'authorization_code'

app.use(express.json())

var browser;

var creds = {
    client_id: "",
    email: "",
    password: ""
}

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
    }

    if (Array.isArray(basta.scope)) {
        basta.scope = basta.scope.join(',');
    }

    var options = Object.assign({}, basta);
    var authorizationUri = authorizeURL_Path + '?' + qs.stringify(options);
    //console.log('function authorizationUri.....', authorizationUri);

    var page = await context.newPage();
   
    await page.goto(authorizationUri);

    await login(params, page).catch((error) => {
        console.log('Login and consent..', error);
    });
    //loginAndConsent(params, page, last);
};

async function login(params, page) {
    await page.waitFor(2000);
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

    //Add 2fa - if screen is 2fa -> check for question -> if it contains child or job or pet, etc.
    //await access.click();

    // await Promise.all([
    //     page.waitForNavigation(),
    //     page.once('consent', () => console.log('Consent..')),
    // ])
    // //await page.waitFor(2000);
    // //const access2 = await page.$('button[name="hasApproved"]', );
    // const access2 = await page.$('button[value="true"]', );
    // await access2.click();
};

app.listen(3001, (err) => {
    if (err) return console.error(err);

});