const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const passportConfig = require('../passport');
const User = require('../models/User');
const ToDo = require('../models/ToDo');
const JWT = require('jsonwebtoken');


const signToken = userId =>
{
    return JWT.sign(
        {
            iss: 'Az',
            sub: userId
        }, "Az", {expiresIn: '30s'}
    );
}

userRouter.post('/register', (req, res) => 
{
    const {username, password, role} = req.body;
    User.findOne({username}, (err, user) =>
        {
            if(err)
                res.status(500).json({message: {msgBody: "error has occured", msgError: true}});
            if(user)
                res.status(400).json({message: {msgBody: "user is already taken", msgError: true}});
            else
            {
                const newUser = new User({username, password, role});
                newUser.save((err) =>
                {
                    if(err)
                        res.status(500).json({message: {msgBody: "error has occured", msgError: true}});
                    else
                        res.status(201).json({message: {msgBody: "Account successfully created", msgError: false}});
                });
            }
        });
});

userRouter.post('/login', passport.authenticate('local', {session: false}),(req, res) =>
{
    const {_id, username, role} = req.user;
    const token = signToken(_id);
    res.cookie('access_token', token, {httpOnly: true, sameSite: true});
    res.status(200).json({isAuthenticated: true, user: {username, role}});
});

userRouter.get('/logout', passport.authenticate('jwt', {session: false}),(req, res) =>
{
    res.clearCookie('access_token');
    res.json({user: {username: "", role: ""}, success: true});
})

userRouter.post('/todo', passport.authenticate('jwt', {session: false}), (req, res) => 
{
    const toDo = new ToDo(req.body);
    toDo.save((err) => 
    {
        if(err)
            res.status(500).json({message: {msgBody: "error has occured", msgError: true}});
        else
        {
            req.user.toDos.push(toDo);
            req.user.save((err) => 
            {
                if(err)
                    res.status(500).json({message: {msgBody: "error has occured", msgError: true}});
                else
                    res.status(200).json({message: {msgBody: "Todo successfully created", msgError: false}});
            });
        }
    });
});

userRouter.get('/todos', passport.authenticate('jwt', {session: false}), (req, res) => 
{
    User.findById({_id: req.user._id}).populate('toDos').exec((err, document) => 
    {
        if(err)
            res.status(500).json({message: {msgBody: "error has occured", msgError: true}});
        else
            res.status(200).json({toDos: document.toDos, authenticated: true});
    });
});

userRouter.patch('/todo', passport.authenticate('jwt', {session: false}), (req, res) => 
{
    const {_id, name} = req.body;

    Todo.findByIdAndUpdate(_id, {"name": name}, {new: true},  (err, document) => {
        if(err)
            res.status(500).json({message: {msgBody: "error has occured", msgError: true}});
        else{
            res.status(200).json({todo: document, authenticated: true});
        }

    });
});

userRouter.get('/admin', passport.authenticate('jwt', {session: false}), (req, res) => 
{
    if(req.user.role === 'admin')
        res.status(200).json({message: {msgBody: "you are an admin", msgError: false}});
    else
        res.status(403).json({message: {msgBody: "you are not an admin", msgError: true}});
});

module.exports = userRouter;