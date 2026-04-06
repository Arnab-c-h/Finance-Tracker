const bcrypt = require('bcryptjs');

exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

exports.comparePassword = async (candidate, hash) => {
  return await bcrypt.compare(candidate, hash);
};