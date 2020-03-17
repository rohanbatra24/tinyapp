const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
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

  console.log(req.params);
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  let templateVars = { shortURL: shortURL, longURL: longURL };
  res.render('urls_show', templateVars);
});
