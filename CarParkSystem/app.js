var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');

var dbConn = mongodb.MongoClient.connect("mongodb://Admin:admin123@cs1813namedb-shard-00-00-maax9.mongodb.net:27017,cs1813namedb-shard-00-01-maax9.mongodb.net:27017,cs1813namedb-shard-00-02-maax9.mongodb.net:27017/test?ssl=true&replicaSet=CS1813NameDB-shard-0&authSource=admin&retryWrites=true&w=majority/CarParkDatabase");

dbConn.then(() => {
    console.log("Successfully connected to server."); // Open localhost:3000
})

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, 'public'), { index: 'Homepage.html' }));

/////////// Form POST and GET requests////////////////////


app.post('/post-feedback', function (req, res) {
    // This is the working previous code.
    // dbConn.then(function (db) {
    //     db.collection('TicketsTable').insertOne(req.body);
    // });
    // res.send('Data received:\n' + JSON.stringify(req.body));

    dbConn.then(function (db) {

        var count = db.collection('TicketsTable').count({});
        req.body._id = Promise.resolve(count) + 1;
        
        db.collection('TicketsTable').insertOne(req.body);
    });
    res.send('Data received:\n' + JSON.stringify(req.body));
});

app.get('/view-feedback', function (req, res)
{
    dbConn.then(function (db)
    {
        db.collection('TicketsTable').find({}).toArray().then(function (feedbacks)
        {
            res.status(200).json(feedbacks);
        });
    });
});

/////////// Happy Hour POST and GET requests////////////////////

app.post('/post-happyhour', function (req, res) {
    dbConn.then(function (db) {
        //delete req.body._id;
        db.collection('HappyHourTable').insertOne(req.body);
    });
    res.send('Happy-Hour received:\n' + JSON.stringify(req.body));

});
app.get('/view-hh', function (req, res) {
    dbConn.then(function (db) {
        db.collection('HappyHourTable').find({}).toArray().then(function (feedbacks) {
            res.status(200).json(feedbacks);
        });
    });
});

/////////// Manager POST and GET requests////////////////////

app.post('/view-managerCr', function (req, res) {
    dbConn.then(function (db)
     {

        db.collection('ManagerTable').find({'Username': req.body.name, 'Password': req.body.password}).toArray().then(function (feedbacks) {

        if (feedbacks.length != 0) res.redirect('/managerLanding.html')
        else res.redirect('managerlogin.html');

        });
    });
});


app.post('/post-manager', function (req, res) {
    dbConn.then(function (db) {
        //delete req.body._id;
        db.collection('ManagerTable').insertOne(req.body);
    });
    res.send('Manager received:\n' + JSON.stringify(req.body));

});

app.get('/view-manager', function (req, res) {
    dbConn.then(function (db) {
        db.collection('ManagerTable').find({}).toArray().then(function (feedbacks) {
            res.status(200).json(feedbacks);
        });
    });
});

app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0');

/////////// Chart GET request and draw chart////////////////////

app.get('/view-customer', function (req, res)
{
    dbConn.then(function (db)
    {
        var cursor = db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
            let customer= 0;
            let residence = 0;
            let employee = 0;

            feedbacks.forEach(function (arrayItem) {
                for (const [key, value] of Object.entries(arrayItem)){
                    if (key == "ticketType"){
                        if (value == "Customer"){
                            customer += 1;
                        } else if (value == "Residence"){
                            residence +=1;
                        }else if (value == "Employee"){
                            employee +=1;
                        }
                    }
                };
            });
            let data = [customer, residence, employee];
            let labels = ["Customer", "Residence", "Employee"]
            res.status(200).json(data);
            res.send(data)

        });
        /*function renderChart(data, labels) {
                var ctx = document.getElementById("myChart").getContext('2d');
                var myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'This week',
                            data: data,
                        }]
                    },
                });
            };*/
    });
});

/*
app.get('/myChart', function renderChart(data, labels) {
    var ctx = document.getElementById("myChart").getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'This week',
                data: data,
            }]
        },
    });
})

("#renderBtn").click(
    function () {
        data = [20000, 14000, 12000, 15000, 18000, 19000, 22000];
        labels =  ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        renderChart(data, labels);
    }
);*/
