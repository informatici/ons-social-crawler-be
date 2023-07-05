const { validationResult } = require("express-validator");
const firebase = require("../utilities/firebase");

const index = async (req, res, next) => {
  try {
    const users = await firebase.getUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

const indexId = async (req, res, next) => {
  try {
    const uid = req.params.uid;
    const user = await firebase.getUser(uid);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await firebase.postUser(req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await firebase.putUser(req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const destroy = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await firebase.deleteUser(req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const verify = async (req, res, next) => {
  const bearer = req.headers.authorization;
  try {
    const token = bearer.split(" ")[1];
    const user = await firebase.checkAuth(token);
    res.status(200).json(user);
  } catch (err) {
    res.status(403).send("Unauthorized");
  }
};

module.exports = {
  index,
  indexId,
  create,
  update,
  destroy,
  verify,
};
