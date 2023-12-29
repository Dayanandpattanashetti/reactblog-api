const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const id = user._id || user.userId;
  return jwt.sign({ userId: id }, "mySecretKey", { expiresIn: "6h" });
};

const generateRefreshToken = (user) => {
  const id = user._id || user.userId;
  return jwt.sign({ userId: id }, "myRefreshKey");
};

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, "mySecretKey", (err, user) => {
      if (err) {
        res.status(403).json("invalid token");
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    res.status(401).json("You are not authenticated");
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verify,
};
