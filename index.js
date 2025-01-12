const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser= require("body-parser")
const PORT = 3001;

app.use(cors());


const orders =  [];

app.post("/neworder", bodyParser.json(), (req, res) => {
    console.log(req.body);
    res.send("ok");
})

console.log("SERVER STARTED");
app.listen(PORT);