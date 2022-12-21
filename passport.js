const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');
const JwtStrategy = require('passport-jwt').Strategy;

const cookieExtractor = req => {
    let token = null;
    if(req && req.cookies){
        token = req.cookies["access_token"];
    }

    return token;
}

// authorization for protecting ressources
passport.use(new JwtStrategy({
    jwtFromRequest: cookieExtractor,
    secretOrKey: "Az"
}, (payload, done) => {
    User.findById({_id: payload.sub}, (err, user) => {
        if(err)
            return done(err, false);
        if(user)
            return done(null, user);
        else 
            return done(null, false);

    })
}))

// authentication by username and password

// done(err) return error 
// done(null, false)   unauthorized
// done(null, user)    add user to payload and isautenticated true
passport.use(new LocalStrategy((username, password, done) => 
{
    User.findOne({username}, (err, user)=>
    {
        if(err)
            return done(err);
        if(!user)
            return done(null, false);
        user.comparePassword(password, done);
    });
}));
