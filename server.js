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
    let email = request.query.email;

    let products = await getProducts();

    products = products.filter(prod => prod.name.toLowerCase().includes(keyword));

    for (let product of products) {
        await getImageSignedUrl(product);
        await checkIfUserBoughtIt(product, email);
    }

    response.send(products);
})

app.get('/getMyBoughtProducts', async function (request, response) {
    let email = request.query.email;

    let products = await getProducts();
    let transactions = await defaultDatabase.collection('transactions').where('user', '==', email).get();

    products = products.filter(product => {
        let bought = false;
        transactions.forEach(t => {
            if(t.get('product') == product.id)
                bought = true;
        });
        return bought;
    });

    for (let product of products) {
        await getImageSignedUrl(product);
    }

    products.forEach(p => p.boughtByMe = true);
    response.send(products);
})

app.get('/buyProduct', async function (request, response) {
    let productId = request.query.productId;
    let email = request.query.email;

    const res = await defaultDatabase.collection('transactions').add({
        product: productId,
        user: email
    });
    //res.id is the document id

    response.sendStatus(200);
})

app.get('/returnProduct', async function (request, response) {
    let productId = request.query.productId;
    let email = request.query.email;

    let transactions = await defaultDatabase.collection('transactions').where('user', '==', email).get();

    transactions.forEach(async (t) => {
        if(t.get('product') == productId){
            const res = await defaultDatabase.collection('transactions').doc(t.id).delete();
        }            
    });

    response.sendStatus(200);
})

async function getImageSignedUrl(product) {    
    await storageBucket.file(product.imagePath).getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
    }).then(url => {
        return url[0];
    }).then( url => {
        product.signedUrl = url;
    });
}

async function checkIfUserBoughtIt(product, email) {
    let transactions = await defaultDatabase.collection('transactions').where('user', '==', email).get();
    let bought = false;
    transactions.forEach(t => {
        if(t.get('product') == product.id)
            bought = true;
    });

    product.boughtByMe = bought;
}

async function getProducts() {
    const snapshot = await defaultDatabase.collection('products').get();
    return snapshot.docs.map(doc => {
        let d = doc.data();
        d.id = doc.id;
        return d;
    });
}

// app.post('/addProduct', async function (request, response) {
//     const data = JSON.parse(request.body.data);

//     var imageFile = request.files.image.data;
//     fs.writeFileSync('./temp/' + data.name + '.jpg', imageFile);
//     await storageBucket.upload('./temp/' + data.name + '.jpg', {
//         // Support for HTTP requests made with `Accept-Encoding: gzip`
//         gzip: true,
//         // By setting the option `destination`, you can change the name of the
//         // object you are uploading to a bucket.
//         metadata: {
//           // Enable long-lived HTTP caching headers
//           // Use only if the contents of the file will never change
//           // (If the contents will change, use cacheControl: 'no-cache')
//           cacheControl: 'public, max-age=31536000',
//         },
//     });
    
//     response.send('fine')
// })

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
})