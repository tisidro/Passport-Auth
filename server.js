//when not in production mode
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const flash = require('express-flash')
const session = require('express-session') //do an npm install express-session
const passport = require('passport')
const methodOverride = require('method-override') //do anconst  npm install method-override. This here is requiring this library

const initializePassport = require('./passport-config')
//finding user based on email
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

const users = [] //storing here in local variable instead of db just for example -- do not do irl!

//setting view engine
app.set('view-engine', 'ejs')
//take forms from email & pw and access them inside request variable inside /register post method below
app.use(express.urlencoded({ extended: false }))
app.use(flash()) //using flash, second var in session means don't resave if nothing changed in session, don't save empty value (save uninitialized false)
app.use(
  session({
    secret: process.env.SESSION_secret,
    resave: false,
    saveUninitialized: false
  })
) //first param is secret key stored .env,

app.use(passport.initialize())
app.use(passport.session())
//Benefit of session() with passport: req.user is always going to be sent to the user that is authenticated at that moment
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name }) //personalizes greeting to logged in user on index page
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

//using passport authentication middleware... local means the *local strategy*, first param where we go if success, second if failure, flash failure means
app.post(
  '/login',
  checkNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true //shows flash message to user from the passport config files messages
  })
)

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10) //2nd input is how many time to has
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('login') //if registration was successful, go to login
  } catch {
    res.redirect('/register')
  }
  console.log(users)
})

//to log out (an express method)
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

//protecting our routes with middleware function that checks if authenticated
function checkAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    //if true
    return next()
  }
  res.redirect('/login')
}

//so user can't type "/login" and go back to blank login if they are already logged in
function checkNotAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    //if true send them back to homepage
    return res.redirect('/') //keeps them at "hello message"
  }
  next() //if NOT authenticated, send to the route they typed in (/login)
}
app.listen(3000)
