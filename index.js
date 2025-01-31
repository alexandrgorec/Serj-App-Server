const express = require("express");
const app = express();
require('dotenv').config();
const cors = require("cors");
const bodyParser = require("body-parser")
const path = require('path');
const session = require('express-session');
const PORT = process.env.PORT || 3001;
const STATIC_PATH = path.join(__dirname, "./build");
const cookieParser = require('cookie-parser');
const { pool } = require("./db.js");


app.use(cors());
app.use(cookieParser(process.env.SECRET_COOKIE));
app.use(session({
    secret: process.env.SECRET_COOKIE,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 3600 * 24 * 10,
        httpOnly: true,
    }
}));


// app.use((req, res, next) => {
//     req.session.auth = false;
//     next();
// })

app.get('/', (req, res) => {
    if (req.session.auth == false) {
        res.sendFile(__dirname + "/auth.html");
    } else {
        res.sendFile(path.join(STATIC_PATH, 'index.html'));
    }
});

app.post('/auth', bodyParser.urlencoded(), (req, res) => {
    console.log(req.body);
    if (req.body.u === "123" && req.body.p === "123") {
        req.session.auth = true;
        console.log("AUTH!!!")
    }
    res.redirect("/")
});


app.use(express.static(STATIC_PATH));


app.post("/neworder", bodyParser.json(), (req, res) => {
    if (req.session.auth) {
        const order = req.body
        const now = new Date();
        const insertText = 'INSERT INTO orders(orderjson, orderdate) VALUES ($1, $2)'
        pool.query(insertText, [order, now]);
        res.sendStatus(202);
    }
    else {
        req.session.destroy();
        res.sendStatus(401);
    }
})

app.post("/getallorders", bodyParser.json(), (req, res) => {
    if (req.session.auth) {
        pool.query("select * from orders", (err, result) => {
            if (err) {
                console.error('Error connecting to the database', err.stack);
                res.sendStatus(406);
            } else {
                console.log('Connected to the database: get allOrders');
                res.status(202);
                res.json(result.rows);
            }
        });

    }
    else {
        req.session.destroy();
        res.sendStatus(401);
    }
})



app.get("/*", (req, res) => {
    req.session.auth = req.session.auth || false;
    if (req.session.auth == false) {
        res.sendFile(__dirname + "/auth.html");
    } else {
        res.sendFile(path.join(STATIC_PATH, 'index.html'));
    }
})




console.log(`SERVER STARTED ON PORT:${PORT}`);
app.listen(PORT);