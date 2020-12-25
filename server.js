var path = require('path');
var express = require('express');
var app = express();
var fileUpload = require('express-fileupload');
var fs = require('fs');

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var dir = path.join(__dirname, 'public');

app.use(express.static(dir));
app.use(express.json());
app.use(fileUpload());

var admin = require("firebase-admin");

var serviceAccount = require("./firebase-credentials.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

var defaultDatabase = admin.firestore();
var storageBucket = admin.storage().bucket();

app.get('/searchProducts', async function (request, response) {
    let keyword = request.query.keyword.toLowerCase();

    let products = await getProducts();

    products = products.filter(prod => prod.name.toLowerCase().includes(keyword));

    response.send(products);
})

async function getProducts() {
    const snapshot = await defaultDatabase.collection('products').get()
    return snapshot.docs.map(doc => doc.data());
}

app.post('/addProduct', async function (request, response) {
    const data = JSON.parse(request.body.data);
    var imageFile = request.files.image.data;

    fs.writeFileSync('./temp/' + data.name + '.jpg', imageFile);
    await storageBucket.upload('./temp/' + data.name + '.jpg', {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
          // Enable long-lived HTTP caching headers
          // Use only if the contents of the file will never change
          // (If the contents will change, use cacheControl: 'no-cache')
          cacheControl: 'public, max-age=31536000',
        },
    });
    
    response.send('fine')
})

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
})