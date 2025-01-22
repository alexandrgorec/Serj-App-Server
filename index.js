const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser= require("body-parser")
const PORT = 3001;

app.use(cors());


const orders =  [];

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


console.log("SERVER STARTED");
app.listen(PORT);