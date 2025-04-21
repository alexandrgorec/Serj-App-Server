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
const jwt = require('jsonwebtoken');


app.use(cors());
app.use(cookieParser(process.env.SECRET_KEY));
app.use(bodyParser.json());

const checkAuth = (req, res, next) => {
    jwt.verify(req.body.token, process.env.SECRET_KEY, (err, result) => {
        if (err) {
            res.sendStatus(999);
        }
        else {
            req.body.rights = result.user.rights;
            req.body.user = result?.user?.name || '';
            next();
        }
    });
}


const SUPPLIERS = ['РНК', "Барс", "Грасс", "Юма"];
const BUYERS = ['Техресурс', "Слава", "Мостпроект", "тройка-тт", "Тайга", "Сеч", "Горбунов"];
const DRIVERS = ['Василий Иванович', "Григорий", "Димооооон", "Анатолий Степанович"];
const TYPE_OF_PRODUCT = ['ДТ-Е-К5', "Дизель", "Не дизель", "GT-POWER"];
const MANAGERS = ['Антон', "Сержан", "ЦАРЬ", "Иванов"];



// app.get("/test", (req, res) => {
//     const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaW5CbG9ja0FjY2VzcyI6dHJ1ZSwiaWF0IjoxNzQyMjk4NTQ3fQ.cqzFXD01hJurFsTdRkD1fThymjXKtPoBBukqZRUODRI"
//     const verify = jwt.verify(token, process.env.SECRET_KEY);
//     res.send(verify);

// })


app.post('/getAccessToken', (req, res) => {
    const sql = 'select * from users where login = $1';
    pool.query(sql, [req.body.u], (err, result) => {
        if (err) {
            res.send("ошибка доступа к базе данных")
        }
        else {
            if (result.rowCount !== 0) {
                const user = result.rows[0];
                if (req.body.p === user.password) {
                    res.status(202);
                    const payload = {
                        user: {
                            name: user?.userinfo?.name || '',
                            rights: user.rights,
                        },
                    }
                    const token = jwt.sign(payload, process.env.SECRET_KEY, {
                        expiresIn: 60 * 60 * 24 * 7,
                    });
                    res.send(token);
                }
                else {
                    res.send('Ошибка авторизации'); // неверный пароль
                }
            }
            else {
                res.send("Ошибка авторизации") // такого опльзователя не существует
            }
        }
    })
});


app.use(express.static(STATIC_PATH));


// app.get("/createuser", (req, res) => {
//     const rights = {};
//     const codeUserExist = 23505;
//     rights.finBlockAccess = true;
//     const login = '123';
//     const password = '123';
//     const userinfo = {
//         name: "Бухгалтер Галина",
//     }
//     const insertText = 'INSERT INTO users(login, password, rights, userinfo) VALUES ($1, $2, $3, $4)';
//     pool.query(insertText, [login, password, rights, userinfo], (err, result) => {
//         if (err)
//             if (err.code = codeUserExist)
//                 res.send(`Пользователь ${login} уже существует`);
//             else
//                 res.send('Ошибка')
//         if (result)
//             res.send('пользователь создан');
//     });

// })

app.use(checkAuth);

app.post("/getData", (req, res) => {
    res.status(202);
    const selectListsData = {
        SUPPLIERS: ['РНК', "Барс", "Грасс", "Юма"],
        BUYERS: ['Техресурс', "Слава", "Мостпроект", "тройка-тт", "Тайга", "Сеч", "Горбунов"],
        DRIVERS: ['Василий Иванович', "Григорий", "Валера", "Анатолий Степанович"],
        TYPE_OF_PRODUCT: ['ДТ-Е-К5', "Дизель", "АИ-95", "GT-POWER"],
        MANAGERS: ['Антон', "Сержан", "Семён", "Иванов"],
    }
    const user = {
        name: req.body.user,
        rights: req.body.rights,
    }
    res.send({
        selectListsData,
        user,
    })
})

app.post("/neworder", (req, res) => {
    const order = req.body.order;
    const now = new Date();
    const insertText = 'INSERT INTO orders(orderjson, orderdate) VALUES ($1, $2) RETURNING id';
    const result = pool.query(insertText, [order, now], (err, result) => {
        if (err) {
            res.sendStatus(400);
        }
        else {
            res.status(202);
            res.send(result.rows[0].id);
        }


    });

})


app.post("/getallorders", (req, res) => {
    pool.query("select * from orders ORDER BY id DESC", (err, result) => {
        if (err) {
            console.error('Error connecting to the database', err.stack);
            res.send('ошибка доступа к базе данных');
        } else {
            res.status(202);
            const answer = {}
            answer.orders = result.rows;
            res.json(answer);
        }
    });
})

app.post("/deleteorder", (req, res) => {
    const id = req.body.id;
    pool.query("delete from orders where id = $1", [id], (err, result) => {
        if (err) {
            console.error('Error delete order', err.stack);
            res.send('ошибка доступа к базе данных');
        } else {
            res.sendStatus(202);
        }
    });
})

app.post("/editorder", bodyParser.json(), (req, res) => {
    const order = req.body.order;
    pool.query("UPDATE orders SET orderjson = $1 where id = $2", [order, order.id], (err, result) => {
        if (err) {
            console.error('Error connecting to the database', err.stack);
            res.send('ошибка доступа к базе данных');
        } else {
            console.log('EDIT ORDER');
           
            res.sendStatus(202);
        }
    });

})


console.log(`SERVER STARTED ON PORT:${PORT}`);
app.listen(PORT);