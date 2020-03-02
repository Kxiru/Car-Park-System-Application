var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var nodemailer = require('nodemailer');

var currentUsername = "";
var userToExpect = "";
var codeToExpect = "";
var inResetProcess = false;

var currentdate = new Date();
var datetime = currentdate.getDate() + "/"
    + (currentdate.getMonth() + 1) + "/"
    + currentdate.getFullYear() + " , "
    + currentdate.getHours() + ":"
    + currentdate.getMinutes() + ":"
    + currentdate.getSeconds();

const backHome = "<input type='submit' formaction='Homepage.html' class='button_active' value='Back to Home'></input>";
const backMLanding = "<input type='submit' formaction='managerLanding.html' class='button_active' value='BACK TO LANDING'></input>";
const CSSStyling = "<head> <meta charset='utf-8'> <title>Entry Details</title> <link rel='stylesheet' href='css/style.css'> </head>";

var dbConn = mongodb.MongoClient.connect("mongodb://Admin:admin123@cs1813namedb-shard-00-00-maax9.mongodb.net:27017,cs1813namedb-shard-00-01-maax9.mongodb.net:27017,cs1813namedb-shard-00-02-maax9.mongodb.net:27017/test?ssl=true&replicaSet=CS1813NameDB-shard-0&authSource=admin&retryWrites=true&w=majority/CarParkDatabase");

dbConn.then(() => {
    console.log("Successfully connected to server."); // Open localhost:3000
}).catch(e => console.log(e));

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, 'public'), { index: 'Homepage.html' }));

/////////// Form POST and GET requests////////////////////

app.post('/verifyTicketID', function (req, res) {
    (async () => {
        let db = await dbConn;
        let criteria = await req.body.TicketID;

        console.log("Passed ID: " + criteria);
        // db.collection('TicketsTable').find({ id: 3 }).toArray().then(function (feedbacks) {
        db.collection('TicketsTable').find({ _id: parseInt(criteria) }).toArray().then(function (initialfeedbacks) {
            let currentdate = new Date()
            var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " , "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
            if (initialfeedbacks.length != 0) {
                // Updates the time out (milliseconds)
                db.collection('TicketsTable').update(
                    { _id: parseInt(criteria) },
                    { $set: { 'timeOut': currentdate, 'formattedTimeOut': datetime } }
                );

                db.collection('TicketsTable').find({ _id: parseInt(criteria) }).toArray().then(function (feedbacks) {

                    //Time spent in the CarPark calculation
                    const parkRate = 0.80;
                    const secondsSpentIn = (feedbacks[0].timeOut - feedbacks[0].timeIn) / 1000;
                    console.log(secondsSpentIn);
                    const hoursSpentIn = secondsSpentIn / 3600;
                    let stayPrice = (hoursSpentIn * parkRate).toFixed(2);
                    const employeeDiscount = 0.7;
                    
                    receipt = CSSStyling + "<div class='box'><form>";
                    receipt += "<h2>Thank you for staying in the Car Park.</h2>"
                    receipt += feedbacks[0].name + ", Your ID is " + criteria + ".<br>";

                    if(feedbacks[0].ticketType == "Employee"){

                        receipt += "<br>As an Employee, please enjoy a 30% discount on your stay. You would have paid: £<b>" + stayPrice + "</b><br>";
                        stayPrice = stayPrice * employeeDiscount;
                    }

                    //Formatting for receipt generation
                    receipt += "<br>You signed in at: " + feedbacks[0].formattedTimeIn + ". </br>You signed out at: " + datetime + (".<br>");

                    //Receipt completion and payment...
                    receipt += "<br><hr>You spent " + hoursSpentIn.toFixed(2) + " hours in the car park.";
                    receipt += "<br> At a rate of £" + parkRate + " per hour, you have £<b>" + stayPrice + "</b> to pay.";
                    // pricelink = "<a href='http://www.paypal.me/nkeirukaw/" + stayPrice + "'>Click here to Pay Now</a>";
                    // pricelink = "<input type='button' value='Click here to Pay Now.' onclick='location.href='http://www.paypal.me/nkeirukaw/" + stayPrice + "''>"
                    // pricelink = "<button type='submit' formaction='http://www.paypal.me/nkeirukaw/" + stayPrice + "'>Click me</button>";

                    pricelink = "<input type='submit' formaction='http://www.paypal.me/nkeirukaw/" + stayPrice + "' class='button_active' value='Click here to Pay Now'></input>";
                    receipt += "<br><hr>" + pricelink;
                    receipt += backHome;
                    receipt += "</div></form>";
                    res.send(receipt);

                })
            }
            else {
                res.send(CSSStyling + '<div class="box"><form><br><h3>This ticket ID could not be found.</h3><br>Please check the ID and try again.' + backHome + "</form></div>");
            }
        });
    })();
});

async function addTicket(req,res) {
    let db = await dbConn;
    let count = await db.collection('TicketsTable').count();
    let currentdate = new Date();
    var datetime = currentdate.getDate() + "/"
    + (currentdate.getMonth() + 1) + "/"
    + currentdate.getFullYear() + " , "
    + currentdate.getHours() + ":"
    + currentdate.getMinutes() + ":"
    + currentdate.getSeconds();

    req.body._id = count + 1;
    //Set MillisecondTimeIn
    req.body.timeIn = currentdate.getTime();
    //Set FormattedTimeIn
    req.body.formattedTimeIn = datetime;
    console.log(req.body);

    //alert("Your Ticket ID is: " + count);
    feedbackstring = CSSStyling + "<div class='box'><form>";
    feedbackstring += "<h3>" + req.body.name + ", your ticket has been generated successfully.</h3>Your ticket ID is: <b>" + req.body._id + "</b><br>";
    feedbackstring += "<br> Please remember your Ticket ID for future reference.";
    feedbackstring += backHome + "</div></form>";

    db.collection('TicketsTable').insertOne(req.body);
    //Rather than Have the user see their JSONified input, give them their Ticket ID.
    res.send(feedbackstring);
    //res.send('Data received:\n' + JSON.stringify(req.body));
}

app.post('/post-tickets', function (req, res) {
    (async () => {

        let db = await dbConn;
        let count = await db.collection('TicketsTable').count();

        //Check for Employee and discount code
        if (req.body.ticketType == "Employee") {
            // console.log("Dealing with an employee.");

            db.collection("ManagerTable").find({ EmpLogin: true }).toArray().then(function (discountCode) {

                // console.log("realdisccode: " + discountCode[0].EmployeeCode);
                // console.log("given disccode:" + req.body.discountCode);

                if (req.body.discountCode == discountCode[0].EmployeeCode) {
                    console.log("DiscountCode accepted.");
                    addTicket(req,res);
                } else {
                    console.log("Discount code not accepted");
                    res.send(CSSStyling + "<div class='box'><form> <h3>Your Employee ID is not valid.</h3><br>Please try again." + backHome + "</form></div>");
                }
            });
        }else{
        addTicket(req,res);
        }
    })();
});

// This is the working previous code.
// dbConn.then(function (db) {
//     db.collection('TicketsTable').insertOne(req.body);
// });
// res.send('Data received:\n' + JSON.stringify(req.body));

//Working but more obtuse code
// dbConn.then( function (db) {
//     var count = db.collection('TicketsTable').count().then(c => {
//         console.log(c);
//         req.body.id = c + 1;
//         console.log(count);
//         console.log(req.body)
//         db.collection('TicketsTable').insertOne(req.body);
//     });
// });
// res.send('Data received:\n' + JSON.stringify(req.body));


app.get('/viewTicketEntries', function (req, res) {
    if (currentUsername.length != 0)
    {
        dbConn.then(function (db) {
            db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
                feedbackstring = CSSStyling + "<body> <div class='response-box' style='resize:vertical'>" +
                "<img class='mainicon' src='css/images/historyicon.png' alt='logo'>";
                feedbackstring += "<h2>TICKET HISTORY</h2> <div class='scroll-box'>";

                for (i = 0; i < feedbacks.length; i++) {
                    feedbackstring += JSON.stringify(feedbacks[i]) + "<hr>";
                }
                feedbackstring += "</div> <br> <form class='go-back-form'>" + backMLanding + "</form> </body>";
                res.status(200).send(feedbackstring);
            });
        });
    }
    else res.redirect('/OperationNotValidPage.html');
});

/////////// Happy Hour POST and GET requests////////////////////

app.post('/post-happyhour', function(req, res)
{
    if (currentUsername.length != 0)
    {
        if (req.body.hours.length != 0 && req.body.hours != 0)
        {
            dbConn.then(function(db)
            {
                var hours = req.body.hours;
                var timeRegistered = "";
                var date = new Date();

                timeRegistered += (date.getDate() + "/");
                timeRegistered += (date.getMonth() + "/");
                timeRegistered += (date.getFullYear() + "   ");
                timeRegistered += (date.getHours() + ":");
                timeRegistered += (date.getMinutes() + ":");
                timeRegistered += (date.getSeconds());

                db.collection('HappyHourTable').insertOne({
                    NumberOfHours: hours,
                    TimeRegistered: timeRegistered
                });
            });

            // "redirect"
            var Style = "<head> <meta charset='utf-8'> <title>Happy Hour Registered</title> <link rel='stylesheet' href='css/style.css'> </head>";
            feedbackstring = Style + "<div class='box'><form>";
            feedbackstring += "<br> Successfuly set happy hour for " + req.body.hours + " hours from now.";
            feedbackstring += backMLanding + "</div></form>";
            res.send(feedbackstring);
        }
        else
        {
            // can't insert 0 happy hours
            var Style = "<head> <meta charset='utf-8'> <title>Happy Hour Error</title> <link rel='stylesheet' href='css/style.css'> </head>";
            feedbackstring = Style + "<div class='box'><form>";
            feedbackstring += "<br> Operation not valid.";
            feedbackstring += backMLanding + "</div></form>";
            res.send(feedbackstring);
        }
    }
    else res.redirect('/OperationNotValidPage.html');
});

app.get('/viewHappyHourEntries', function (req, res) {
    if (currentUsername.length != 0)
    {
        dbConn.then(function (db) {
            db.collection('HappyHourTable').find({}).toArray().then(function (feedbacks) {
                feedbackstring = CSSStyling + "<body> <div class='response-box' style='resize:vertical'>" +
                "<img class='mainicon' src='css/images/historyicon.png' alt='logo'>";
                feedbackstring += "<h2>HAPPY HOUR LOG</h2> <div class='scroll-box'>";

                for (i = 0; i < feedbacks.length; i++) {
                    feedbackstring += JSON.stringify(feedbacks[i]) + "<hr>";
                }
                feedbackstring += "</div> <br> <form class='go-back-form'>" + backMLanding + "</form> </body>";
                res.status(200).send(feedbackstring);
            });
        });
    }
    else res.redirect('/OperationNotValidPage.html');
});

/////////// Manager POST and GET requests////////////////////

function getRandomDigit_ASCII()
{
    var minBase = 48;
    var code = Math.random() * (57 - 48) + minBase;
    var chr = String.fromCharCode(code);
    return chr;
}

function getRandomUppercaseLetter_ASCII()
{
    var minBase = 65;
    var code = Math.random() * (90 - 65) + minBase;
    var chr = String.fromCharCode(code);
    return chr;
}

function getRandomNonUppercaseLetter_ASCII()
{
    var minBase = 97;
    var code = Math.random() * (122 - 97) + minBase;
    var chr = String.fromCharCode(code);
    return chr;
}

function getRandomLetter_ASCII()
{
    // this is to prevent the hash being easily cracked
    var x = Math.floor(Math.random() * Math.floor(2));
    if (x == 1) return getRandomNonUppercaseLetter_ASCII();
    return getRandomUppercaseLetter_ASCII();
}

function createHashPassword()
{
    var password = "";

    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomDigit_ASCII();
    // in total, 20 characters
    return password;
}

function createRecoveryCode()
{
    var password = "";

    password += getRandomLetter_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomDigit_ASCII();
    password += getRandomLetter_ASCII();
    password += getRandomDigit_ASCII();

    return password;
}

app.post('/sendManagerCodeResetPassword', function(req, res)
{
    dbConn.then(function (db) {
        db.collection('ManagerTable').find({ 'Username': req.body.F_Username }).toArray().then(function (feedbacks)
        {
            if (feedbacks.length != 0)
            {
                // generate the code
                var code = createRecoveryCode();
                var email = feedbacks[0].Email;

                codeToExpect = code;
                userToExpect = req.body.F_Username;
                inResetProcess = true; // this means that the user has started the recovery process. He cannot undo this. He has to complete the process if he wants to log in with the same username.

                // send it to the user's email address
                let transporter = nodemailer.createTransport({
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        requireTLS: true,
                        auth: {
                            user: 'carparksystem.cs1813@gmail.com',
                            pass: 'snapchat'
                        }
                        });

                        var mailContent = "";
                        mailContent = "We've detected that you've tried to reset your password.\n"
                        mailContent += "In order for your password to be reset, we need to check if it really is you. Therefore, you need a recovery code to move forward.\n";
                        mailContent += "Here is your recovery code: " + code + ". ";
                        let mailOptions = {
                        from: 'carparksystem.cs1813@gmail.com',
                        to: email,
                        subject: 'Reset Password Action Detected',
                        text: mailContent
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                          if (!error) console.log('Email sent: ' + info.response);
                    });


                // redirect
                res.redirect('/CodeResetPasswordPage.html');
            }
            else
            {
                var page = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\'utf-8\'><title>Correct Credentials</title>";
                page += "</head><body><div><form class=\"box\">";
                page += "Invalid username. Could not process operation. <br>";
                page += "<input type=\"button\" name=\"logout\" class=\"button_active\" value=\"Back to homepage\" onclick=\"location.href='Homepage.html';\" />";
                page += "</form></div></body></html>";

                res.send(page);
            }
        });
    });
});

app.post('/forgotManagerCredentials', function(req, res)
{
    dbConn.then(function (db)
    {
        if (inResetProcess)
        {
            db.collection('ManagerTable').find({ 'Username': userToExpect }).toArray().then(function (feedbacks)
            {
                if (feedbacks.length != 0)
                {
                    // need to do some checking of the credentials
                    // 1. create a proper hash to change the password with
                    // 2. change the password
                    // 3. send the password via email

                    // i'll make my own hash for the new password instead of using an app
                    // m - non-uppercase character - char 97-->120
                    // M - uppercase character - char 65-->90
                    // d - digit - char 48-->57
                    // the password will be of length 20
                    // m-M-M-M-m-d-M-d-d-d-m-m-M-m-d-d-M-m-d-d

                    var usern = userToExpect;
                    var email = feedbacks[0].Email;

                    // get the new password
                    var newPass = createHashPassword();

                    // update the query
                    db.collection('ManagerTable').update(
                            { Username: usern, Email: email},
                            { $set: { 'Password': newPass } }
                        );

                    // send email to user

                    let transporter = nodemailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 587,
                            secure: false,
                            requireTLS: true,
                            auth: {
                                user: 'carparksystem.cs1813@gmail.com',
                                pass: 'snapchat'
                            }
                            });

                            var mailContent = "";
                            mailContent = "We've detected that you've tried to reset your password.\n"
                            mailContent += "You can enter this password into the login page and change it afterwards.\n";
                            mailContent += "Here is your new password: " + newPass + ". ";
                            let mailOptions = {
                            from: 'carparksystem.cs1813@gmail.com',
                            to: email,
                            subject: 'Reset Password Action Detected',
                            text: mailContent
                            };

                            transporter.sendMail(mailOptions, function(error, info){
                              if (!error) console.log('Email sent: ' + info.response);
                        });

                     // reset the variables for the reset password process
                     inResetProcess = false;
                     userToExpect = "";
                     codeToExpect = "";

                     // redirect
                     var page = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\'utf-8\'>";
                     page += "<title>Password Recovery Successful</title>";
                     page += "<link rel=\'stylesheet\' href=\'css/style.css\'></head>";
                     page += "<body><div class=\"box\"><form>"
                     page += "Password Successfully Reset. <br> Check your email and login to the manager dashboard. <br>";
                     page += "<input type=\"button\" name=\"logout\" class=\"button_active\" value=\"Back to Login\" onclick=\"location.href='managerlogin.html';\" />";
                     page += "</form></div></body></html>";

                     res.send(page);
                }
                else
                {
                    var page = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\'utf-8\'><title>Correct Credentials</title>";
                    page += "<link rel=\'stylesheet\' href=\'css/style.css\'>";
                    page += "</head><body><div><form class=\"box\">";
                    page += "Could not reset password. Please check your username and try again. <br>";
                    page += "<input type=\"button\" name=\"logout\" class=\"button_active\" value=\"Back to homepage\" onclick=\"location.href='Homepage.html';\" />";
                    page += "</form></div></body></html>";

                    res.send(page);
                }
            });
        }
        else
         {
            // this means that the user tries to redirect to a wrong page.
            var page = "<!DOCTYPE html><html lang=\"" + "en" + "\"><head>";
            page += "<meta charset=\'utf-8\'><title>Operation not valid</title>";
            page += "<link rel=\'stylesheet\' href=\'css/style.css\'>";
            page += "</head><body><div class=\"box\"><form>";
            page += "Operation not valid.<br>";
            page += "</form></div></body></html>";

            res.send(page);
         }
    });

});

function Login(req, res)
{
    dbConn.then(function (db) {
            db.collection('ManagerTable').find({ 'Username': req.body.name, 'Password': req.body.password }).toArray().then(function (feedbacks) {

                if (feedbacks.length != 0)
                {
                    codeToExpect = "";
                    userToExpect = "";
                    inResetProcess = false;

                    currentUsername = req.body.name;
                    res.redirect('/managerLanding.html');
                }
                else
                {
                    var page = "<!DOCTYPE html><html lang=\"en\"><head>";
                    page += "<meta charset=\'utf-8\'><title>Manager Login Failed</title>";
                    page += "<link rel=\'stylesheet\' href=\'css/style.css\'>";
                    page += "</head><body><div class=\"box\">";
                    page += "<form>Incorrect Credentials. <br>Try again. <br>";
                    page += "<input type=\"button\" name=\"logout\" class=\"button_active\" value=\"Back to Login\" onclick=\"location.href='managerlogin.html';\" />";
                    page += "</form></div></body></html>";

                    res.send(page);
                }

            });
        });
}


app.post('/managerLogin', function (req, res)
{
    if (inResetProcess)
    {
        var page = "<!DOCTYPE html><html lang=" + "en" + "><head><meta charset=" + "'utf-8'>";
        page += "<title>Cannot Login - Reset Password</title>";
        page += "<link rel='stylesheet' href='css/style.css'>";
        page += "</head><body><div><form class=" + "box" + ">";
        page += "It seems that you have attempted to reset your password. Unfortunately, we cannot let you login to this page unless you complete the process.  <br>";
        page += "<input type=" + "\"button\"" + "name=" + "\"logout\"" + "class=" + "\"button_active\"" + "value=" + "\"Continue\"" + "onclick=" + "\"location.href='CodeResetPasswordPage.html';\"" + " />";
        page += "</form></div></body></html>";

        res.send(page);
    }
    else Login(req, res);
});

app.post('/post-manager', function (req, res) {
    dbConn.then(function (db) { db.collection('ManagerTable').insertOne(req.body); });
    res.send('Manager received:\n' + JSON.stringify(req.body));
});

app.post('/changePasswordManager', function(req, res){
    dbConn.then(function(db)
    {
        db.collection('ManagerTable').find({'Username': currentUsername, 'Password': req.body.CurrentPass}).toArray().then(function (feedbacks)
        {
            try
            {
                var passw = feedbacks[0].Password;
                var usern = feedbacks[0].Username;
                var email = feedbacks[0].Email;
                var currentPass = req.body.CurrentPass;
                var newPass = req.body.NewPass;
                var confirmPass = req.body.ConfirmPass;

                if (passw == currentPass && newPass == confirmPass && currentUsername == usern)
                {
                    db.collection('ManagerTable').update(
                        { Username: usern },
                        { $set: { 'Password': newPass } }
                    );

                    // send email as notification
                    let transporter = nodemailer.createTransport({
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        requireTLS: true,
                        auth: {
                            user: 'carparksystem.cs1813@gmail.com',
                            pass: 'snapchat'
                        }
                        });

                        var mailContent = "Somebody has changed a password for the following user: " + currentUsername + " . \n If you recognize this action, you can leave this email alone. If not, please let us know by sending a reply to this email.";
                        let mailOptions = {
                        from: 'carparksystem.cs1813@gmail.com',
                        to: email,
                        subject: 'Change Password Action Detected',
                        text: mailContent
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                          if (!error) console.log('Email sent: ' + info.response);
                    });

                    currentUsername = ""; // so that testers cannot jump to this page without the username set up

                    // redirect
                    var page = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\'utf-8\'>";
                    page += "<title>Password Change Successful</title>";
                    page += "<link rel=\'stylesheet\' href=\'css/style.css\'>";
                    page += "</head><body><div><form class=\"box\">";
                    page += "Successful operation. <br> Please relogin with your new password.<br>";
                    page += "<input type=\"button\" name=\"logout\" class=\"button_active\" value=\"Back to Login\" onclick=\"location.href='managerlogin.html';\" />";
                    page += "</form></div></body></html>";

                    res.send(page);
                }
                else
                {
                    // redirect to a page where you let the user know that the password change operation has failed
                    var page = "<!DOCTYPE html><html lang=\"en\"><head>";
                    page += "<meta charset=\'utf-8\'><title>Password Change Failed</title>";
                    page += "<link rel=\'stylesheet\' href=\'css/style.css\'>";
                    page += "</head><body><div class=\"box\"><form>";
                    page += "Unsuccessful operation.<br>Try again.";
                    page += "<input type=\"button\" name=\"logout\" class=\"button_active\" value=\"Go Back\" onclick=\"location.href='changePasswordManager.html';\" />";
                    page += "</form></div></body></html>";

                    res.redirect(page);
                }
            }
            catch(error)
            {
                if (currentUsername.length != 0)
                {
                    // redirect to a page where you let the user know that the password change operation has failed
                    var page = "<!DOCTYPE html><html lang=\"en\"><head>";
                    page += "<meta charset=\'utf-8\'><title>Password Change Failed</title>";
                    page += "<link rel=\'stylesheet\' href=\'css/style.css\'>";
                    page += "</head><body><div class=\"box\"><form>";
                    page += "Unsuccessful operation.<br>Try again.";
                    page += "<input type=\"button\" name=\"logout\" class=\"button_active\" value=\"Go Back\" onclick=\"location.href='changePasswordManager.html';\" />";
                    page += "</form></div></body></html>";

                    res.redirect(page);
                }
                else res.redirect('/OperationNotValidPage.html');
            }
        });
    });
});

app.post('/checkLoggedin', function(req, res)
{
    checkManagerLoggedIn(res, '/newManager.html');
});

app.post('/send-ManagerCr', function (req, res){
    if (currentUsername.length != 0)
    {
        let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: 'carparksystem.cs1813@gmail.com',
            pass: 'snapchat'
        }
        });

        var mailContent = "You have been assigned as a new manager! Here are your new credentials:\n" + "Username: " + req.body.Username + "\n" + "Password: " + req.body.Password + "\n";
        let mailOptions = {
        from: 'carparksystem.cs1813@gmail.com',
        to: req.body.Email,
        subject: 'New Manager Car Park Credentials',
        text: mailContent
        };

        transporter.sendMail(mailOptions, function(error, info){
          if (!error)
          {
                dbConn.then(function (db)
                {
                    db.collection('ManagerTable').insertOne(req.body);
                });
                console.log('Email sent: ' + info.response);
          }
        });
        res.redirect('managerLanding.html');
    }
    else res.redirect('/OperationNotValidPage.html');
});

app.get('/viewManagerEntries', function (req, res) {
    if (currentUsername.length != 0)
    {
        dbConn.then(function (db) {
            db.collection('ManagerTable').find({}).toArray().then(function (feedbacks) {

                feedbackstring = CSSStyling + "<body> <div class='response-box' style='resize:vertical'>" +
                "<img class='mainicon' src='css/images/managericon.png' alt='logo'>";
                feedbackstring += "<h2>MANAGERS TABLE</h2> <div class='scroll-box'>";
                for (i = 0; i < feedbacks.length; i++) {
                    feedbackstring += JSON.stringify(feedbacks[i]) + "<hr>";
                }
                feedbackstring += "</div> <br> <form class='go-back-form'>" + backMLanding + "</form> </body>";
                res.status(200).send(feedbackstring);
            });
        });
    }
    else res.redirect('/OperationNotValidPage.html');
});

/////////// Chart GET request and draw chart////////////////////

function checkManagerLoggedIn(res, link)
{
    if (currentUsername.length != 0) res.redirect(link);
    else res.redirect('OperationNotValidPage.html');
}

app.post('/seeCarsChart', function(req, res)
{
    checkManagerLoggedIn(res, '/carsInside.html'); // if the user is logged in, jump to that page. otherwise, jump to the login page.
});

app.post('/seeTicketsChart', function(req, res)
{
    checkManagerLoggedIn(res, '/numOfTicChart.html'); // if the user is logged in, jump to that page. otherwise, jump to the login page.
});

app.get('/getManualReport', function(req, res)
{
    if (currentUsername.length == 0) res.redirect('/OperationNotValidPage.html');
    else res.redirect('/manualReport.html');
});

app.get('/tickets-sold', function (req, res) {
    dbConn.then(function (db) {
        db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
            let customer= 0;
            let resident = 0;
            let employee = 0;

            feedbacks.forEach(function (arrayItem) {
                for (const [key, value] of Object.entries(arrayItem)) {
                    if (key == "ticketType") {
                        if (value == "Customer") {
                            customer += 1;
                        } else if (value == "Resident"){
                            resident +=1;
                        }else if (value == "Employee"){
                            employee +=1;
                        }
                    }
                };
            });
            let data = [customer, resident, employee];
            let labels = ["Customer", "Resident", "Employee"]
            res.send({data, labels})
        });

    });
});

app.get('/insidecarpark', function (req, res) {
    dbConn.then(function (db) {
        db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
            carsin =[0,0,0]

            feedbacks.forEach(function (arrayItem) {
                let customer=false;
                let resident = false;
                let employee = false;
                for (const [key, value] of Object.entries(arrayItem)) {
                    if (key == "ticketType") {
                        if (value == "Customer") {
                            customer = true;
                            carsin[0] += 1
                        } else if (value == "Resident") {
                            resident = true;
                            carsin[1] += 1
                        } else if (value == "Employee") {
                            employee = true;
                            carsin[2] += 1
                        }
                    }
                    if (key == "timeOut") {
                        if (customer == true) {
                            carsin[0] -= 1
                        } else if (resident == true) {
                            carsin[1] -= 1
                        } else if (employee == true) {
                            carsin[2] -= 1
                        }
                    }
                }
            });
            res.send(carsin)
        });

    });
});



app.get('/manual-report', function (req, res) {
    if (currentUsername.length != 0) {

        console.log(req.query)
        let startReport = new Date(req.query.date + " " + req.query.startTime);
        let endReport = new Date(req.query.date + " " + req.query.endTime);
        let timediff = endReport.getHours() - startReport.getHours() + 1;

        console.log(startReport.getHours() > endReport.getHours());

        if (startReport.getHours() > endReport.getHours()) {
            res.redirect('/managerLanding.html');
            console.log("accessed");
        } else {
            dbConn.then(function (db) {
                db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
                    var custoIn = new Array(timediff).fill(0);
                    var residIn = new Array(timediff).fill(0);
                    var emploIn = new Array(timediff).fill(0);


                    feedbacks.forEach(function (arrayItem) {
                        // console.log(arrayItem)
                        let customer = false;
                        let resident = false;
                        let employee = false;
                        for (const [key, value] of Object.entries(arrayItem)) {
                            if (key == "ticketType") {
                                if (value == "Customer") {
                                    customer = true;
                                } else if (value == "Resident") {
                                    resident = true;
                                } else if (value == "Employee") {
                                    employee = true;
                                }
                            }
                            if (key == "timeIn") {
                                let currentvalue = new Date(value);

                                // currentvalue.setTime(value)
                                if (currentvalue.getDate() == startReport.getDate() && currentvalue.getMonth() == startReport.getMonth()) {

                                    if (currentvalue.getHours() >= startReport.getHours() && currentvalue.getHours() <= endReport.getHours()) {

                                        if (customer == true) {
                                            custoIn[currentvalue.getHours() - startReport.getHours()] += 1
                                        } else if (resident == true) {
                                            residIn[currentvalue.getHours() - startReport.getHours()] += 1
                                        } else if (employee == true) {
                                            emploIn[currentvalue.getHours() - startReport.getHours()] += 1
                                        }
                                    }
                                }
                            }
                        }
                    });

                    let timings = []
                    for (let i = startReport.getHours(); i <= endReport.getHours(); i++) {
                        timings[i - startReport.getHours()] = (i + ":00")
                    }
                    res.send({custoIn, residIn, emploIn, timings})
                });
            });
        }
    }
    else res.redirect('/NotLoggedInChangePasswordAttempt.html'); // to prevent users who are not logged in to access this information
});

app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0');
