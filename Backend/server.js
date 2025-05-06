const express = require('express');
const app=express();
require('dotenv').config();
app.use(express.json());

const PORT = process.env.PORT;

app.listen((PORT),()=>{
    console.log(`server running on http://localhost:${PORT}`)
})