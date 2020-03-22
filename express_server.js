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
  // cc: {
  //   longUrl: 'http://ccc',
  //   userID: 'Rw6gvd'
  // },
  // dd: {
  //   longUrl: 'http://ddd',
  //   userID: 'Rwfaw34vd'
  // }
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

// GET /urls/:shortUrl
app.get('/urls/:shortUrl', (req, res) => {
  const shortUrl = req.params.shortUrl;
  // check if short url exists in url database
  if (!urlDatabase[shortUrl]) {
    res.send('Short url does not exist.');
    return;
  }
  // check if user is logged in
  for (let user in users) {
    if (user === req.session.user_id) {
      const user = users[req.session.user_id];
      const longUrl = urlDatabase[shortUrl].longUrl;
      let templateVars = {
        shortUrl: shortUrl,
        longUrl: longUrl,
        user: user,
        urls: urlDatabase
      };
      res.render('urls_show', templateVars);
      return;
    }
  }
  res.send('Please login.');
});

//POST /urls
app.post('/urls', (req, res) => {
  const longUrl = req.body.longUrl;
  const shortUrl = generateRandomString();
  // if user is logged in, add object to url database with short url as key and longUrl
  //  and user id nested
  for (let user in users) {
    if (user === req.session.user_id) {
      urlDatabase[shortUrl] = {
        longUrl: `http://${longUrl}`,
        userID: user
      };
    }
  }
  res.redirect(`/urls/${shortUrl}`);
});

// GET /u/:shortUrl
app.get('/u/:shortUrl', (req, res) => {
  // redirect to corresponding long URL
  const shortUrl = req.params.shortUrl;
  let longUrl = `${urlDatabase[shortUrl].longUrl}`;
  res.redirect(longUrl);
});

//POST /urls/:shortUrl/delete
app.post('/urls/:shortUrl/delete', (req, res) => {
  const shortUrl = req.params.shortUrl;
  // if user owns url, delete it from database
  if (urlDatabase[shortUrl].userID === req.session.user_id) {
    delete urlDatabase[shortUrl];
    res.redirect(`/urls/`);
  } else {
    res.redirect(`/login/`);
  }
});

// POST /urls/:shortUrl/
app.post('/urls/:shortUrl/', (req, res) => {
  const shortUrl = req.params.shortUrl;
  // Update the long URL with new long url
  if (urlDatabase[shortUrl].userID === req.session.user_id) {
    const longUrl = `http://${req.body.newLongUrl}`;
    urlDatabase[shortUrl].longUrl = longUrl;
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
    return;
  }

  // if email already exists, send message
  for (let user in users) {
    if (users[user].email === req.body.email) {
      res.send('Email already exists');
      return;
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
