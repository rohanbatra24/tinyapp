const generateRandomString = function() {
  let result = '';
  let randomChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 6; i++) result += randomChars[Math.round(Math.random() * (randomChars.length - 1))];
  return result;
};

const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
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
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
  console.log(templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  // we can get the shortURL from the req.params
  // we have to find a way to get the longURL
  // shortURL + urlDatabase -> longURL

  // user is looking at a list of their short urls
  // they can click on one of them to see more details
  // that redirects them to a new url -> /urls/:shortURL

  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  let templateVars = { shortURL: shortURL, longURL: longURL };
  res.render('urls_show', templateVars);
});

app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  console.log(longURL.longURL);
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortUrl', (req, res) => {
  console.log('----------------hello------------');

  const shortURL = req.params.shortUrl;
  let longURL = urlDatabase[shortURL];
  console.log(longURL);
  res.redirect(longURL);
});
