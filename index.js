const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser")
const path = require('path');
const PORT = 3001;
const STATIC_PATH = path.join(__dirname, "./build");
app.use(express.static(STATIC_PATH));
app.use(cors());




const orders = [];

app.post("/neworder", bodyParser.json(), (req, res) => {
    orders.push(req.body);
    console.log("Все заявки:");
    console.log(orders);
    res.send("ok");
})

app.post("/getallorders", bodyParser.json(), (req, res) => {
    console.log("getAllOrders:");
    console.log(orders);
    res.send(orders);
})

app.get("/", (req, res) => {
    console.log("connected");
    res.sendFile(path.join(STATIC_PATH, 'index.html'));
})


console.log("SERVER STARTED");
app.listen(PORT);