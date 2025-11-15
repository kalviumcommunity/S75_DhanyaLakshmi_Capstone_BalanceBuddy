const express = require('express');
const userRoutes = express.Router();
const User = require('../model/userSchema');
const bcrypt=require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

userRoutes.post('/signup',async(req,res)=>{
    try{
        const{name,mail,password} = req.body;
        if(!name||!mail||!password){
            return res.status(400).json({
                error:"All fields are required"
            })
        }
        if(!mail.includes('@')){
            return res.status(400).json({
                error:"Not a valid E-mail!"
            })
        }
        if(password.length < 6){
            return res.status(400).json({
                error:"Password must be greater than 3!"
            })
        }
        const hashedPassword=await bcrypt.hash(password,10);
        const newUser = await User.create({name,mail,password:hashedPassword});
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


userRoutes.put('/signup/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, mail, password } = req.body;


        const updatedUser = await User.findByIdAndUpdate(userId,{ name, mail, password },{ new: true });
        
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (err) {
        return res.status(500).json({
            error: "Something went wrong",
            message: err.message
        });
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
        const checkUser = await User.findOne({mail: mail});
        if (!checkUser) {
        return res.status(400).json({ err: "User Not Found", checkUser: password });
        }
  
        const isMatch = await bcrypt.compare(password, checkUser.password);
        if (!isMatch) {
        return res.status(401).json({ Error: "Incorrect password or mail" });
        }
        const payload = { id: checkUser._id, name: checkUser.name };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15h' });
  
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            maxAge: 15 * 60 * 60 * 1000
        });
      
        return res.status(200).json({
            mess:"Successfully Logined!",
            token:token
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
