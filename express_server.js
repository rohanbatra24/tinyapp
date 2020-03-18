const generateRandomString = function() {
  let result = '';
  let randomChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 6; i++) result += randomChars[Math.round(Math.random() * (randomChars.length - 1))];
  return result;
};

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/urls/new', (req, res) => {
  let templateVars = { username: req.cookies['username'] };
  res.render('urls_new', templateVars);
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies['username'] };
  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  let templateVars = { shortURL: shortURL, longURL: longURL, username: req.cookies['username'] };
  res.render('urls_show', templateVars);
});

app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = `http://${longURL}`;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortUrl', (req, res) => {
  const shortURL = req.params.shortUrl;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls/`);
});

app.post('/urls/:shortURL/', (req, res) => {
  const shortUrl = req.params.shortURL;
  const longURL = req.body.newLongUrl;
  urlDatabase[shortUrl] = longURL;
  res.redirect(`/urls/`);
});

app.post('/login/', (req, res) => {
  const username = req.body.username;
  console.log(req.cookies);
  res.cookie('username', username);
  res.redirect(`/urls/`);
});

app.post('/logout/', (req, res) => {
  res.clearCookie('username');
  res.redirect(`/urls/`);
});

app.get('/register', (req, res) => {
  res.render('login_form', { username: req.cookies['username'] });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
