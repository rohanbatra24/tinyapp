const getUserByEmail = function(email, database) {
  for (let user_id in database)
    if (database[user_id].email === email) {
      return database[user_id];
    }
};

module.exports = getUserByEmail;
