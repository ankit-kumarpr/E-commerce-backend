exports.validatePassword = (password) => {
  // Min 8, at least 1 uppercase, 1 digit, 1 special char
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).{8,}$/;
  return regex.test(password);
};

exports.allowedSelfRoles = ['seller','user'];
