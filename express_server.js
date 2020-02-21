////////////////////////////////////////////////////////////////////////
/*
SETUP
FUNCTIONS
VARIABLES
*/

// app config
const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({name: 'session', secret: 'grey-rose-juggling-volcanoes'}));

const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');

// functions
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

// variables
const urlDatabase = {};
const users = {};

////////////////////////////////////////////////////////////////////////
/*
ROUTING
*/

// root - GET
// redirects to /urls if logged in, otherwise to /login
app.get('/', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// urls index page - GET
// shows urls that belong to the user, if they are logged in
app.get('/urls', (req, res) => {
  const userID = req.session.userID;
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = { urls: userUrls, user: users[userID] };
  
  if (!userID) {
    res.statusCode = 401;
  }
  
  res.render('urls_index', templateVars);
});

// new url creation - POST
// adds new url to database, redirects to short url page
app.post('/urls', (req, res) => {
  if (req.session.userID) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.userID
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    const errorMessage = 'You must be logged in to do that.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
});

// new url creation page - GET
// validates if the user is logged in before displaying page
app.get('/urls/new', (req, res) => {
  if (req.session.userID) {
    const templateVars = {user: users[req.session.userID]};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

// short url page - GET
// shows details about the url if it belongs to user
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.userID;
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = { urlDatabase, userUrls, shortURL, user: users[userID] };

  if (!urlDatabase[shortURL]) {
    const errorMessage = 'This short URL does not exist.';
    res.status(404).render('urls_error', {user: users[userID], errorMessage});
  } else if (!userID || !userUrls[shortURL]) {
    const errorMessage = 'You are not authorized to see this URL.';
    res.status(401).render('urls_error', {user: users[userID], errorMessage});
  } else {
    res.render('urls_show', templateVars);
  }
});

// url edit - POST
// updates longURL if url belongs to user
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.userID  && req.session.userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.updatedURL;
    res.redirect(`/urls`);
  } else {
    const errorMessage = 'You are not authorized to do that.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
});

// delete url - POST
// deletes url from database if it belongs to user
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.userID  && req.session.userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    const errorMessage = 'You are not authorized to do that.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
});

// redirecting - GET
// redirects to the long (actual) url
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    const errorMessage = 'This short URL does not exist.';
    res.status(404).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
});

// login page - GET
// redirects to urls index page if already logged in
app.get('/login', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {user: users[req.session.userID]};
  res.render('urls_login', templateVars);
});

// logging in - POST
// redirects to urls index page if credentials are valid
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userID = user.userID;
    res.redirect('/urls');
  } else {
    const errorMessage = 'Login credentials not valid. Please make sure you enter the correct username and password.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
});

// logging out - POST
// clears cookies and redirects to urls index page
app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect('/urls');
});

// registration page - GET
// redirects to urls index page if already logged in
app.get('/register', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {user: users[req.session.userID]};
  res.render('urls_registration', templateVars);
});

// registering - POST
// redirects to urls index page if credentials are valid
app.post('/register', (req, res) => {
  if (req.body.email && req.body.password) {

    if (!getUserByEmail(req.body.email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.userID = userID;
      res.redirect('/urls');
    } else {
      const errorMessage = 'Cannot create new account, because this email address is already registered.';
      res.status(400).render('urls_error', {user: users[req.session.userID], errorMessage});
    }

  } else {
    const errorMessage = 'Empty username or password. Please make sure you fill out both fields.';
    res.status(400).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
});

// server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});