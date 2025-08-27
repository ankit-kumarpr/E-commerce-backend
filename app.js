const express = require("express");
const cors = require("cors");
const path = require("path");
const connectToDb = require("./DB/db");
const AuthRoutes=require('./routes/auth.routes');
const KycRoutes = require('./routes/kyc.routes');

const app = express();

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/gnet/auth/',AuthRoutes);
app.use('/gnet/kyc/', KycRoutes);

module.exports = app;
