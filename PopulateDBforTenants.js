const loki = require('lokijs');

const db = new loki('tenantsList-UAT.json');

createdb();

function createdb() {
    console.log("creating db.....")
    //create collections
    var tenant = db.addCollection('tenantsList');

    //populate collection
    client_list.insert({
        xero_tenant_id: ''});
console.log(client_list.data);
    db.saveDatabase();
};