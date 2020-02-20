////////////////////////////////////////////////////////////////////////
/*
Basic configurations
Variables
Functions
*/
const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({name: 'session', secret: 'grey-rose-juggling-volcanoes'}));

const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');

const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

const urlDatabase = {};
const users = {};

////////////////////////////////////////////////////////////////////////
/*
Routing
*/

// root
// redirects to /urls if logged in, otherwise to /login
app.get('/', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// urls index page
// shows urls that belong to the user, if they are logged in
app.get('/urls', (req, res) => {
  const userID = req.session.userID;
  const userUrls = urlsForUser(userID, urlDatabase);
  let templateVars = { urls: userUrls, user: users[userID] };
  
  if (!userID) {
    res.statusCode = 401;
  }
  
  res.render('urls_index', templateVars);
});

// new url creation
// adds new url to database, redirects to urls show page
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.userID
  };
  res.redirect(`/urls/${shortURL}`);
});

// new url creation page
// validates if the user is logged in before displaying page
app.get('/urls/new', (req, res) => {
  if (req.session.userID) {
    let templateVars = {user: users[req.session.userID]};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

// short url page showing the short/long versions of the url
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.userID;
  const userUrls = urlsForUser(userID, urlDatabase);
  let templateVars = { urlDatabase, userUrls, shortURL, user: users[userID] };

  if (!urlDatabase[shortURL]) {
    res.statusCode = 404;
  } else if (!userID || !userUrls[shortURL]) {
    res.statusCode = 401;
  }
  
  res.render('urls_show', templateVars);
});

// url edit
// validates if the url belongs to current user, then updates longURL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.userID  && req.session.userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.updatedURL;
    res.redirect(`/urls`);
  } else {
    const errorMessage = 'You are not authorized to do that.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage})
  }
});

// delete url
// validates if the url belongs to current user
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.userID  && req.session.userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    const errorMessage = 'You are not authorized to do that.';
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage})
  }  
});

// redirect from short url to the long (actual) urls
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    let templateVars = { urlDatabase: {}, shortURL: '', user: users[req.session.userID] };
    res.statusCode = 404;
    res.render('urls_show', templateVars);
  }
});

// login page
app.get('/login', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }

  let templateVars = {user: users[req.session.userID]};
  res.render('urls_login', templateVars);
});

// logging in
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
      req.session.userID = user.userID;
      res.redirect('/urls');
  } else {
    const errorMessage = 'Login credentials not valid. Please make sure you enter the correct username and password.'
    res.status(401).render('urls_error', {user: users[req.session.userID], errorMessage});
  }
});

// loggin out
app.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect('/urls');
});

// registration page
app.get('/register', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }

  let templateVars = {user: users[req.session.userID]};
  res.render('urls_registration', templateVars);
});

// registering
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
      const errorMessage = 'Cannot create new account, because this email address is already registered.'
      res.status(400).render('urls_error', {user: users[req.session.userID], errorMessage})
    }
  } else {
    const errorMessage = 'Empty username or password. Please make sure you fill out both fields.'
    res.status(400).render('urls_error', {user: users[req.session.userID], errorMessage})
  }
});

// server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});