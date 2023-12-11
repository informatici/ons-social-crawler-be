const configs = require("../configurations/app.config.js");
const fs = require("fs");
var admin = require("firebase-admin");

const serviceAccount = JSON.parse(
  fs.readFileSync(configs.firebaseServiceAccount, "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.getUsers = async () => {
  const users = await admin.auth().listUsers();
  return users;
};

exports.getUser = async (uid) => {
  const user = await admin.auth().getUser(uid);
  return user;
};

exports.postUser = async (data) => {
  const user = await admin.auth().createUser({
    email: data.email,
    emailVerified: true,
    password: data.password,
    displayName: data.displayName,
    disabled: false,
  });

  await admin.auth().setCustomUserClaims(user.uid, { user: data.userRoles });

  return user;
};

exports.putUser = async (data) => {
  const updateUser = {
    email: data.email,
    emailVerified: true,
    displayName: data.displayName,
    disabled: false,
  };

  if (data.password) {
    updateUser.password = data.password;
  }

  const user = await admin.auth().updateUser(data.uid, updateUser);

  await admin.auth().setCustomUserClaims(user.uid, { user: data.userRoles });

  return user;
};

exports.deleteUser = async (data) => {
  const user = await admin.auth().deleteUser(data.uid);
  return user;
};

exports.checkAuth = async (token) => {
  return await admin.auth().verifyIdToken(token);
};

exports.verify = async (req, res, next) => {
  if (req.method === "OPTIONS" || req.originalUrl === "/api/checker") {
    next();
    return;
  }
  const bearer = req.headers.authorization;
  try {
    const token = bearer.split(" ")[1];
    const user = await this.checkAuth(token);
    req.body.roles = user.user ?? [];
    next();
  } catch (err) {
    res.status(403).send("Unauthorized");
  }
};

exports.isAuthorized = (allowRoles) => {
  return (req, res, next) => {
    const roles = req.body.roles;

    if (roles.some((item) => allowRoles.includes(item))) {
      next();
      return;
    }

    res.status(403).send("Unauthorized");
  };
};
