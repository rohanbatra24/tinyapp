const getUserByEmail = require('./helpers.js');
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
app.use(
  cookieSession({
    name: 'session',
    keys: [ 'key' ]
  })
);

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

// Users Object
const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

// Url database Object
const urlDatabase = {
  cc: { longURL: 'http://ccc', userID: 'Rw6gvd' },
  dd: { longURL: 'http://ddd', userID: 'Rwfaw34vd' }
};

//Function to generate random 6 character string for IDs
const generateRandomString = function() {
  let result = '';
  let randomChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 6; i++) result += randomChars[Math.round(Math.random() * (randomChars.length - 1))];
  return result;
};

// Function to filter and return urls based on specific user
const urlsForUser = function(id) {
  const filteredUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrls[url] = urlDatabase[url];
    }
  }
  return filteredUrls;
};

// GET /
app.get('/', (req, res) => {
  // check if user is logged in
  for (let user in users) {
    if (user === req.session.user_id) {
      res.redirect(`/urls/`);
      return;
    }
  }
  res.redirect(`/login/`);
});

// GET /urls/new
app.get('/urls/new', (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    let templateVars = { user: user };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

// GET /urls/
app.get('/urls', (req, res) => {
  const user = users[req.session.user_id];
  const userUrls = urlsForUser(req.session.user_id);
  let templateVars = { urls: userUrls, user: user };
  res.render('urls_index', templateVars);
});

// GET /urls/:shortURL
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  // check if short url exists in url database
  if (!urlDatabase[shortURL]) {
    res.send('Short url does not exist.');
    return;
  }
  // check if user is logged in
  for (let user in users) {
    if (user === req.session.user_id) {
      const user = users[req.session.user_id];
      const longURL = urlDatabase[shortURL].longURL;
      let templateVars = { shortURL: shortURL, longURL: longURL, user: user, urls: urlDatabase };
      res.render('urls_show', templateVars);
      return;
    }
  }
  res.send('Please login.');
});

//POST /urls
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  // if user is logged in, add object to url database with short url as key and longUrl and user id nested
  for (let user in users) {
    if (user === req.session.user_id) {
      urlDatabase[shortURL] = { longURL: `http://${longURL}`, userID: user };
    }
  }
  res.redirect(`/urls/${shortURL}`);
});

// GET /u/:shortUrl
app.get('/u/:shortUrl', (req, res) => {
  // redirect to corresponding long URL
  const shortURL = req.params.shortUrl;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//POST /urls/:shortURL/delete
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  // if user owns url, delete it from database
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls/`);
  } else {
    res.redirect(`/login/`);
  }
});

// POST /urls/:shortURL/
app.post('/urls/:shortURL/', (req, res) => {
  const shortUrl = req.params.shortURL;
  // Update the long URL with new long url
  if (urlDatabase[shortUrl].userID === req.session.user_id) {
    const longURL = req.body.newLongUrl;
    urlDatabase[shortUrl].longURL = longURL;
    res.redirect(`/urls/`);
  } else res.redirect('/login/');
});

// POST /Login
app.post('/login/', (req, res) => {
  let user = getUserByEmail(req.body.email, users);
  // check if user exists in database and password entered is correct
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403).send('Wrong Email or password');
    return;
  }
  // Set cookie
  req.session.user_id = user.id;
  res.redirect(`/urls/`);
  return;
});

// GET /login
app.get('/login/', (req, res) => {
  // display login form
  const user = users[req.session.user_id];
  let templateVars = { user: user };
  res.render(`login_form`, templateVars);
});

// POST /logout
app.post('/logout/', (req, res) => {
  // delete current session cookie
  req.session = null;
  res.redirect(`/urls/`);
});

// GET /register
app.get('/register', (req, res) => {
  // if logged in, redirect to urls page
  for (let user in users) {
    if (user === req.session.user_id) {
      res.redirect('/urls');
      return;
    }
  }

  // else open registration form
  const user = users[req.session.user_id];
  res.render('registration_form', { user: user });
});

// POST /register
app.post('/register', (req, res) => {
  // if email or password entered is blank, return error
  if (req.body.email === '' || req.body.password === '') {
    res.status(404).send('Email or password blank');
  }

  // if email already exists, send message
  for (let user in users) {
    if (users[user].email === req.body.email) {
      res.send('Email already exists');
    }
  }

  // add new user object to users database
  const id = generateRandomString();
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    users[id] = {
      id: id,
      email: req.body.email,
      password: hash
    };
    // Set cookie
    req.session.user_id = id;
    res.redirect('/urls');
  });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
