const passport = require('passport');
const BearerStrategy = require('passport-http-bearer');
const connection = require('../db/config');
const user_module = require('../api/modules/User');
require('../passport_config/auth');
const User = new user_module(connection);


passport.use(new BearerStrategy(
    async function(token, done) {
        const user = await User.getUserByToken(token);
        if (!user) { return done(null, false); }
        if (user.expire_date >= Date.now()) {
            return done(null, false);
        }
        console.log(Date.now())
        return done(null, user, { scope: 'all' });
    }
));