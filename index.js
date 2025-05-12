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

    pool.query("select * from users ", (err, result) => {
        if (err) {
            console.error('Error connecting to the database', err.stack);
            res.send('ошибка доступа к базе данных');
        } else {
            const result1 = result.rows;
            res.send(result1);
        }
    });


    // pool.query("UPDATE users SET userinfo = $1 where id = $2", [{ name: "Менеджер Валера" }, 1], (err, result) => {
    //     if (err) {
    //         console.error('Error connecting to the database', err.stack);
    //         res.send('ошибка доступа к базе данных');
    //     } else {
    //         console.log('EDIT userSelectListsData');

    //         res.sendStatus(202);
    //     }
    // });


})


app.post('/getAccessToken', (req, res) => {
    const selectListsData = {
        SUPPLIERS: [],
        BUYERS: [],
        DRIVERS: [],
        TYPE_OF_PRODUCT: [],
        MANAGERS: [],
    }

    const sql = 'select * from users where login = $1';

    if (req.body.u === 'root') {
        if (req.body.p === process.env.SECRET_KEY) {
            res.status(202);
            const payload = {
                user: {
                    name: 'root',
                    rights: {
                        finBlockAccess: true,
                        adminAccess: true,
                    },
                    selectListsData: selectListsData,
                    userId: 'root',
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
                    res.send("Ошибка авторизации") // такого пользователя не существует
                }
            }
        })
    }
});


app.use(express.static(STATIC_PATH));


app.use(checkAuth);

app.post("/adduser", (req, res) => {
    const rights = req.body.newUser.rights;
    const login = req.body.newUser.login;
    const password = req.body.newUser.password;
    const userInfo = req.body.newUser.userInfo;
    const codeUserExist = 23505;
    const insertText = 'INSERT INTO users (login, password, rights, userinfo) VALUES ($1, $2, $3, $4)';
    pool.query(insertText, [login, password, rights, userInfo], (err, result) => {
        if (err) {
            if (err.code = codeUserExist) {
                res.status(203);
                res.send(`Пользователь ${login} уже существует`);
            }
            else {
                res.status(203);
                res.send(`Неизвестная ошибка`);
            }
        }
        if (result) {
            res.status(202);
            res.send(`Пользователь ${login} создан`);
        }

    });

})

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

app.post("/getListUsers", (req, res) => {
    pool.query("select id, rights,  login, userinfo from users",  (err, result) => {
        if (err) {
            console.error('Error connecting to the database', err.stack);
            res.send('ошибка доступа к базе данных');
        } else {
            res.status(202);
            const answer = {}
            answer.users = result.rows.filter( user => user.id !== req.body.userId);
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

app.post("/deleteuser", (req, res) => {
    // console.log(req.body);
    const id = +req.body.deleteUser.id;
    console.log("userIdDelete:", id);
    pool.query("delete from users where id = $1", [id], (err, result) => {
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