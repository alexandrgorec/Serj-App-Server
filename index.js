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
            // console.log("req.body:", req.body)
            req.body.rights = result.user.rights;
            req.body.user = result?.user?.name || '';
            req.body.selectListsData = req.body.selectListsData || result?.user?.selectListsData || {
                SUPPLIERS: [],
                BUYERS: [],
                DRIVERS: [],
                TYPE_OF_PRODUCT: [],
                MANAGERS: [],
                user: {},
            };
            req.body.userId = result?.user?.userId;
            next();
        }
    });
}


app.get("/test", (req, res) => {

    pool.query("select userinfo from users where id = $1", [1], (err, result) => {
        if (err) {
            console.error('Error connecting to the database', err.stack);
            res.send('ошибка доступа к базе данных');
        } else {
            const userInfo = result.rows[0];
            console.log(userInfo);
            res.send(userInfo.userinfo);
        }
    });


    //  pool.query("UPDATE users SET userinfo = $1 where id = $2", [{name:"Менеджер Валера"}, 1], (err, result) => {
    //                 if (err) {
    //                     console.error('Error connecting to the database', err.stack);
    //                     res.send('ошибка доступа к базе данных');
    //                 } else {
    //                     console.log('EDIT userSelectListsData');

    //                     res.sendStatus(202);
    //                 }
    //             });


})


app.post('/getAccessToken', (req, res) => {
    const selectListsData = {
        SUPPLIERS: ['РНК', "Барс", "Грасс", "Юма"],
        BUYERS: ['Техресурс', "Слава", "Мостпроект", "тройка-тт", "Тайга", "Сеч", "Горбунов"],
        DRIVERS: ['Василий Иванович', "Григорий", "Валера", "Анатолий Степанович"],
        TYPE_OF_PRODUCT: ['ДТ-Е-К5', "Дизель", "АИ-95", "GT-POWER"],
        MANAGERS: ['Антон', "Сержан", "Семён", "Иванов"],
    }

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
                            selectListsData: user?.userinfo?.selectListsData || selectListsData,
                            userId: user.id,
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
    const user = {
        name: req.body.user,
        rights: req.body.rights,
        selectListsData: req.body.selectListsData,
        userId: req.body.userId,
    }
    res.send({
        user,
    })
})

app.post("/neworder", (req, res) => {
    console.log("connected")
    const order = req.body.order; 
    
    const date = new Date();
    let dd = date.getDate();
    if (dd < 10) dd = '0' + dd;
    let mm = date.getMonth() + 1;
    if (mm < 10) mm = '0' + mm;
    let yy = date.getFullYear();
    if (yy < 10) yy = '0' + yy;

    order.date = yy + '-' + mm + '-' + dd;
    const insertText = 'INSERT INTO orders(orderjson) VALUES ($1) RETURNING id';
    const result = pool.query(insertText, [order], (err, result) => {
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

app.post("/editSelectListsData", bodyParser.json(), (req, res) => {
    const selectListsData = req.body.selectListsData;
    // console.log("selectListsData.suppliers", selectListsData.SUPPLIERS)
    const userId = req.body.userId;
    pool.query("select userinfo from users where id = $1", [userId], (err, result) => {
        if (err) {
            console.error('Error connecting to the database', err.stack);
            res.send('ошибка доступа к базе данных');
        } else {

            const userInfo = result.rows[0].userinfo;
            userInfo.selectListsData = selectListsData;
            // console.log("userInfo:", userInfo);
            // res.sendStatus(202);
            pool.query("UPDATE users SET userinfo = $1 where id = $2", [userInfo, userId], (err, result) => {
                if (err) {
                    console.error('Error connecting to the database', err.stack);
                    res.send('ошибка доступа к базе данных');
                } else {
                    // console.log('EDIT userSelectListsData');

                    res.sendStatus(202);
                }
            });
        }
    });




})


console.log(`SERVER STARTED ON PORT:${PORT}`);
app.listen(PORT);