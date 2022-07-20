const express = require('express')
const app = express()
const axios = require('axios')
const qs = require('querystring');
const loki = require('lokijs');

const puppeteer = require('puppeteer');
const db = new loki('./client_credentialsUAT.json');

const port = 3001;

//temp(saved in config_oauth2)
const connections_URL = ''
const login_URL = ''
const authorizeURL_Path = ''
const tokenURL_Path = ''

const redirect_uri = 'http://localhost:3001/callback'
const scope = 'openid profile email projects accounting.transactions accounting.transactions.read accounting.contacts accounting.settings offline_access'
const state = '3(#0/!~'
const grant_type = 'authorization_code'

app.use(express.json())

var browser;
var clientsCollection;
var clientsList;

exports.setAccessTokens = db.loadDatabase({}, function () {
    clientsCollection = db.getCollection('clientcredlist');
    clientsList = clientsCollection.find();

    loadDB(clientsList);
})

async function loadBrowser() {
    return await puppeteer.launch({ headless: false, slowMo: 20 });
}

async function loadDB(clientsList) {
    //console.log('function loadDB..');
    const numClients = clientsList.length;
    browser = await loadBrowser();

    for (let [i, client] of clientsList.entries()) {
        var context = await browser.createIncognitoBrowserContext();

        let last = false;
        if (i+1 == numClients) {
            last = true;
        }

        await openAuthorizeURL(client, context, last);     
    }
    console.log('Done!');
}

async function openAuthorizeURL(params = {}, context, last) {
    //console.log('function openAuthorizeURL');

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

    //loginAndConsent(params, page, last);
    await loginAndConsent(params, page, last).catch((error) => {
       console.log('loginAndConsent..', error);
    });
}

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

    await Promise.all([
        page.waitForNavigation(),
        page.once('consent', () => console.log('Consent..')),
    ])
    //await page.waitFor(2000);
    //const access2 = await page.$('button[name="hasApproved"]', );
    const access2 = await page.$('button[value="true"]', );
    await access2.click();
}

async function loginAndConsent(params = {}, page, last) {
    
    await login(params, page).catch((error) => {
        console.log('Login and consent..', error);
    });
    
    const resp = await page.waitForResponse(request => request.url().includes('/callback')).catch((error) => {
        console.log('page.waitForResponse error.... ' + error);
    });
    //console.log(resp.headers().location);
    const searchParams = new URLSearchParams(resp.headers().location.replace(redirect_uri, ''));
    const code = searchParams.get('code');
    
    var tokens = null;
    const requestToken = searchParams.get('code');

    const swapToken = {
        code: requestToken,
        grant_type: grant_type,
        client_id: params.client_id,
        client_secret: params.client_secret,
        redirect_uri: redirect_uri
    };

    //get and save access token
    await axios.post(tokenURL_Path, qs.stringify(swapToken))
        .then(response => {
             console.log('Response....', response.data);

            var access_token = response.data.access_token
            var refresh_token = response.data.refresh_token
            //console.log('refresh_token: ' + refresh_token);

            //save generated access token in db
            var clientInfo = clientsCollection.findObject({ 'client_id': swapToken.client_id });
            clientInfo.access_token = access_token;
            clientInfo.refresh_token = refresh_token;

            db.saveDatabase();
            console.log(clientInfo, ' saved in DB');

            if (last == true) {
                browser.close();
                process.exit();
            }
        })
        .catch((error) => {
            console.log('Get access token error.... ' + error);
        });
}

app.listen(3001, (err) => {
    if (err) return console.error(err);

});