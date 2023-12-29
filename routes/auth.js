const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { generateToken, generateRefreshToken } = require("./jwt");
const jwt = require("jsonwebtoken");

let refreshTokens = [];

//REGISTER
router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPass,
    });

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      console.log("wrong credentials username");
      return res.status(400).json("wrong credentials");
    }

    const validated = await bcrypt.compare(req.body.password, user.password);

    if (!validated) {
      console.log("wrong credentials paswword");
      return res.status(400).json("wrong credentials");
    }
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);
    const { password, ...data } = user._doc;
    const others = {
      ...data,
      token,
      refreshToken,
    };
    res.status(200).json({ others, token, refreshToken });
  } catch (err) {
    console.log(err.message);
    res.status(500).json(err);
  }
});

//REFRESH TOKEN

router.post("/refresh", (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken) res.status(401).json("You are not authenticated");
  if (!refreshTokens.includes(refreshToken))
    res.status(403).json("refresh token is invalid");

  jwt.verify(refreshToken, "myRefreshKey", (err, user) => {
    err && res.json(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    const newAccessToken = generateToken(user);
    console.log("after refresh access token");
    console.log(newAccessToken);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.push(newRefreshToken);
    res.status(200).json({
      newAccessToken,
      newRefreshToken,
    });
  });
});

module.exports = router;
