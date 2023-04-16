var admin = require("firebase-admin");

var serviceAccount = require("../firebase/dev-ons-firebase-adminsdk-rcogp-7923c4b7ba.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.getUsers = async () => {
  const users = await admin.auth().listUsers();
  return users;
};

exports.postUser = async (data) => {
  const user = await admin.auth().createUser({
    email: data.email,
    emailVerified: true,
    password: data.password,
    displayName: data.displayName,
    disabled: false,
  });
  return user;
};

exports.putUser = async (data) => {
  const user = await admin.auth().updateUser(data.uid, {
    email: data.email,
    emailVerified: true,
    password: data.password, //TODO: da ragionare con Gianpaolo
    displayName: data.displayName,
    disabled: false,
  });
  return user;
};

exports.deleteUser = async (data) => {
  const user = await admin.auth().deleteUser(data.uid);
  return user;
};

exports.checkAuth = async (token) => {
  const res = await admin.auth().verifyIdToken(token);
  console.log(res);
};

exports.verify = async (req, res, next) => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }
  const bearer = req.headers.authorization;
  try {
    const token = bearer.split(" ")[1];
    await this.checkAuth(token);
    console.log("Authorized");
    next();
  } catch (err) {
    res.status(403).send("Unauthorized");
  }
};
