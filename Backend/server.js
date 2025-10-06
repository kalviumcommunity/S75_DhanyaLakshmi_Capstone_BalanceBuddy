const express = require('express');
const app=express();
require('dotenv').config();
// app.use(express.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const transactionRoute = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/familydashboardRoutes');
const goalRoutes = require('./routes/goalRoutes');
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));


const URI = process.env.URI;
const PORT = process.env.PORT;

app.use('/api',userRoutes);
app.use('/api/transactions',transactionRoute);
app.use('/api/dashboard',dashboardRoutes);
app.use('/api',goalRoutes);

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
