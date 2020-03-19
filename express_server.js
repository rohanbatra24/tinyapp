const generateRandomString = function() {
  let result = '';
  let randomChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 6; i++) result += randomChars[Math.round(Math.random() * (randomChars.length - 1))];
  return result;
};

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

const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
app.use(
  cookieSession({
    name: 'session',
    keys: [ 'key' ]
  })
);

const bcrypt = require('bcrypt');

const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  cc: { longURL: 'http://ccc', userID: 'Rw6gvd' },
  dd: { longURL: 'http://ddd', userID: 'Rwfaw34vd' }
};

const urlsForUser = function(id) {
  const filteredUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrls[url] = urlDatabase[url];
    }
  }
  return filteredUrls;
};

// urlsForUser();

app.get('/urls/new', (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    let templateVars = { user: user };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

// app.get('/', (req, res) => {
//   res.send('Hello!');
// });

// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

// app.get('/hello', (req, res) => {
//   res.send('<html><body>Hello <b>World</b></body></html>\n');
// });

app.get('/urls', (req, res) => {
  const user = users[req.session.user_id];
  const userUrls = urlsForUser(req.session.user_id);
  let templateVars = { urls: userUrls, user: user };
  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.session.user_id];
  const shortURL = req.params.shortURL;
  console.log(shortURL);
  const longURL = urlDatabase[shortURL].longURL;
  let templateVars = { shortURL: shortURL, longURL: longURL, user: user, urls: urlDatabase };
  res.render('urls_show', templateVars);
});

app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  for (let user in users) {
    if (user === req.session.user_id) {
      urlDatabase[shortURL] = { longURL: `http://${longURL}`, userID: user };
    }
  }
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortUrl', (req, res) => {
  const shortURL = req.params.shortUrl;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls/`);
  } else {
    res.redirect(`/login/`);
  }
});

app.post('/urls/:shortURL/', (req, res) => {
  const shortUrl = req.params.shortURL;
  if (urlDatabase[shortUrl].userID === req.session.user_id) {
    const longURL = req.body.newLongUrl;
    urlDatabase[shortUrl].longURL = longURL;
    res.redirect(`/urls/`);
  } else res.redirect('/login/');
});

app.post('/login/', (req, res) => {
  // console.log(bcrypt.compareSync(req.body.password, uusers[user].password));

  for (let user in users) {
    if (req.body.email === users[user].email && bcrypt.compareSync(req.body.password, users[user].password)) {
      req.session.user_id = users[user].id;
      res.redirect(`/urls/`);
      return;
    }
  }
  res.status(403).send('Wrong Email or password');
});

app.get('/login/', (req, res) => {
  const user = users[req.session.user_id];
  let templateVars = { user: user };
  res.render(`login_form`, templateVars);
});

app.post('/logout/', (req, res) => {
  req.session = null;
  res.redirect(`/urls/`);
});

app.get('/register', (req, res) => {
  const user = users[req.session.user_id];
  res.render('registration_form', { user: user });
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(404).send('Email or password blank');
  }

  for (let user in users) {
    if (users[user].email === req.body.email) {
      res.send('Email already exists');
    }
  }

  const id = generateRandomString();

  console.log(req.body.password);
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    users[id] = {
      id: id,
      email: req.body.email,
      password: hash
    };
    req.session.user_id = id;
    res.redirect('/urls');
  });
});

app.get('/test', (req, res) => {
  res.send(users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
