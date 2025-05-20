const express = require('express');
const app=express();
require('dotenv').config();
app.use(express.json());
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const transactionRoute = require('./routes/transactionRoutes');
const cookieParser = require('cookie-parser');
app.use(cookieParser());


const URI = process.env.URI;
const PORT = process.env.PORT;

app.use('/api',userRoutes);
app.use('/api/transaction',transactionRoute);

mongoose.connect(URI)
.then(()=>{
    console.log("Database Connected Successfully!")
    app.listen((PORT),()=>{
        console.log(`server running on http://localhost:${PORT}`)
    })
})
.catch((err)=>{
    console.log("Failed to connect",err)
})
