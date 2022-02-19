const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize (passport, getUserByEmail, getUserById) {
  //makes sure user info is correct
  const authenticateUser = async (email, password, done) => {
    const user = getUserByEmail(email) //returns user by email or null if no email
    if (user == null) {
      //if no user found(null) you get an error message
      return done(null, false, {
        message: 'No user with that email, try again.'
      })
    } //check password if user IS found
    try {
      if (await bcrypt.compare(password, user.password)) {
        //user  pw is found
        return done(null, user)
      } else {
        //user not found (first parameter is done)
        return done(null, false, {
          message: 'Password is incorrect, try again'
        })
      }
    } catch (error) {
      return done(error)
    }
  }
  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))

  /*Serializing a user determines which data of the user object should be stored in the session, usually the user id . The serializeUser() function sets 
  an id as the cookie in the user's browser, and the deserializeUser() function uses the id to look up the user in the database and retrieve the user object with data.*/
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id))
  }) //serialize user as single id so must then de-serialize
}

module.exports = initialize
