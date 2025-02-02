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




app.post('/auth', bodyParser.json(), (req, res) => {
    console.log("req.body = ", req.body);
    if (req.body.u === "123" && req.body.p === "123") {
        console.log("AUTH!!!")
        res.send("авторизован");
    }
    else
        res.send("Неверный логин/пароль")
});


app.use(express.static(STATIC_PATH));


app.post("/neworder", bodyParser.json(), (req, res) => {
    const order = req.body
    const now = new Date();
    const insertText = 'INSERT INTO orders(orderjson, orderdate) VALUES ($1, $2)'
    pool.query(insertText, [order, now]);
    res.send('заявка создана');
})

app.post("/getallorders", bodyParser.json(), (req, res) => {
    pool.query("select * from orders", (err, result) => {
        if (err) {
            console.error('Error connecting to the database', err.stack);
            res.send('ошибка доступа к базе данных');
        } else {
            console.log('Connected to the database: get allOrders');
            res.status(202);
            res.json(result.rows);
        }
    });
})






console.log(`SERVER STARTED ON PORT:${PORT}`);
app.listen(PORT);



// app.use(session({
//     secret: process.env.SECRET_COOKIE,
//     resave: true,
//     saveUninitialized: true,
//     cookie: {
//         maxAge: 1000 * 3600 * 24 * 10,
//         httpOnly: true,
//     }
// }));

// app.use((req, res, next) => {
//     req.session.auth =  req.session.auth || false;
//     next();
// })

// app.get('/meeting', (req,res) => {
//     console.log("OPA");
//     console.log("Сессия:",req.session.auth);
//     res.send("1111");
// })