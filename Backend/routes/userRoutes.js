const express = require('express');
const userRoutes = express.Router();
const User =require('../model/userSchema');

userRoutes.post('/signup',async(req,res)=>{
    try{
        const{name,mail,password} = req.body;
        if(!name||!mail||!password){
            return res.status(400).json({
                error:"All fields are required"
            })
        }
        const newUser = await User.create(req.body);
        return res.status(201).json({
            mess:"Successfully Signuped!",
            Data:newUser
        })
    }
    catch(err){
        return res.status(500).json({
            error:"Internal server error",
            err:err.message
        })
    }
});

userRoutes.get('/signup',async(req,res)=>{
    try{
        const Users = await User.find();
        if(!Users){
            return res.status(400).json({
                error:"Failed to Fetch Data!"
            })
        }
        return res.status(200).json({
            mess:"Successfully Fetched!",
            Data:Users
        })
    }
    catch(err){
        return res.status(500).json({
            error:"Internal server error",
            err:err.message
        })
    }
});


userRoutes.post('/login',async(req,res)=>{
    try{
        const {mail,password} = req.body;
        if(!mail||!password){
            return res.status(400).json({
                error:"Incorrect Password or Email"
            })
        }
        return res.status(200).json({
            mess:"Successfully Logined!"
        })
    }
    catch(err){
        return res.status(500).json({
            error:"Internal Server error",
            err:err.message
        })
    }
});

userRoutes.get('/login',async(req,res)=>{
    try{
        const users = await User.find();
        if(!users){
            return res.status(400).json({
                error:"Invalid User"
            })
        }
        return res.status(200).json({
            mess:"Successfully Fetched Logined User's Data!",
            Data:users
        })
    }
    catch(err){
        return res.status(500).json({
            error:"Internal Server error",
            err:err.message
        })
    }
})


module.exports=userRoutes;
