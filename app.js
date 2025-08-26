const express = require("express");
const cors = require("cors");
const connectToDb = require("./DB/db");
const AuthRoutes=require('./routes/auth.routes');

const app = express();

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/gnet/auth/',AuthRoutes);

module.exports = app;
