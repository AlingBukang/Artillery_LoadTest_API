const loki = require('lokijs');

const db = new loki('client_credentialsUAT.json');

createdb();

function createdb() {
    console.log("creating db.....")
    //create collections
    var client_list = db.addCollection('clientcredlist');

    //populate collection
    client_list.insert({
        client_id: '',
        client_secret: '',
        access_token: '',
        refresh_token: '',
        email: '',
        password: '',
        tenant_id: ''});
    client_list.insert({
        client_id: '',
        client_secret: '',
        access_token: '',
        refresh_token: '',
        email: '',
        password: '',
        tenant_id: ''});
console.log(client_list.data);
    db.saveDatabase();
};