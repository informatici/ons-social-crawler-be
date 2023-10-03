var admin = require("firebase-admin");

// var serviceAccount = require("../firebase/dev-ons-firebase-adminsdk-rcogp-7923c4b7baaa.json");
var serviceAccount = require("../firebase/ones2-aid012318-02-04-firebase-adminsdk-hmhmj-99f3b89029.json");

// const serviceAccount = {
//   type: "service_account",
//   project_id: "dev-ons",
//   private_key_id: "7923c4b7ba087475d61b6d7cfbfe2713c4927b05",
//   private_key:
//     "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcZ9cyZ3qU/lqj\nBt8QkjI7pyK5Ucl76If5wBMaY+ljD480IVDDILM2EUewmMRASxjv6CvyOSNL80HP\nbXvuRfW5r+yORqEiTS6TRgsoOFN9L0qj9OgVWI0ZrklaYYwZD5+vRAwxvJ0uyK/j\noOwJMRoYozzUY4GXj1pLqIuOUZvpYs41WFucWg5UUSbeubBmvR0mLBcD0Utj6i1S\ne8iDHa3SnyUpayIKeyR8Q6jF+BchSvBISPPgtuJE9P6vGylwqt66AD/Nm+6UVvFO\nvANxwNZjnJdRo5UuL+znYF3qI7ftz9LlWTUd2kOcqEpBB30uGv5OGw1zcwVB/i7P\nRTkg2k+LAgMBAAECggEAKXFxGm4ws4FcQ5lQKkqDHYpg0h3Z1+2yW7jNHsI4qULM\nt42oJPiqGfmH1GH1TO2SA9JRKRurUmWsMzev/O60tLSqs1n+hHek0VZzVJ26vSg+\nTbQIS7M53OFTs6Xx9OhmK0uNS3De0WQ1BoVEvLm54XYYQwtu27O908oea6VWvrxX\nCvquwvqeiLHFMMtr5VE82+WLCGc2nbZsOvIrF6M/2VkENxM3Hcg7vxgLv082P8K5\n8iDHMyBV3Y+ZTNVVI5L1QO/Up7W3oZU3ol3yilE8uW1aJRRe102XqwrD5qfOgOW2\nSuu8bjy+mJ6JdD8JTgOH1wUpZMYJGnkgmiAfePtg8QKBgQD2sjlyGXgvhN1PR7Dx\nGD71tV7H2cARJOdts0LUlt6XWu9+MG72H88JnnbulOTaMj7p0SE4klQHKg+H4ddJ\nHTGxE3CbOXILZvPedPr9zjTHl7Nt0uoSxx2qZQGd5dclZ1EqVP2NY/i9ak2RmF6M\nGQOiWyIhyOTSjcn55IGpig8oUwKBgQDkt8n41C85AViBeCarI+x7Yt/8lpDNHvnm\nYP7eEowBHrvltWskpVIkT9VaFUJnkBwMWPngU+alt7X6KywHMkuFMfQ4FbluBorf\nVt1cIxBDge6yaJbmulM98lAloqAE1LnMbX+WUWIeppVC6lZvozXxGJ120Bsx4hbZ\n68RL3PN06QKBgHKVRWlhuxkXNVPlkKHrCRNHMsbQtQ1BftzNLnVfvfO/IQ4ToPZg\nv+FP4R3fuow+WkpwAGYuUSkiuCP9GemzzajZxqvSes4g+5SP8SSB6rHqHEUeeepO\n4dCLKb0VTGDrJB/tafeKP7Z68Zx2kTOxSqbWfXwDu4SwpueS40bEAVZRAoGBALti\nLDIVvR6qEJX6F0wtYWjxZ+ssfDPhhgIOQ6EzdsrQIEchbEeYvoSLd5OXSVFJywD+\nwLHea2An9Aqi5i57MU5Nz/VHLyWKbKpwI2mCPKfiQuqeL8uWqe5doPZEl299zT9E\nErzXrljISA+LqAdMozwE27Vk6HLk9a3SsH8q5bdJAoGATHKQyMDdb8XK7mJsQ9NZ\n+UlUgTmjci72sxsBEKRqkBMMJOetZUVMCgmKzCq/gd9sTyTwxzzO/Axxadz3Zz6X\nEa94R+rEGEixQoxtzGwIbHJBd1mlJ9K3GQ4PjAmO6vt7s2GlVjuTQmgoKbjIt8Z0\nUbNvv0TTKL9XaI/JDRoCG1g=\n-----END PRIVATE KEY-----\n",
//   client_email: "firebase-adminsdk-rcogp@dev-ons.iam.gserviceaccount.com",
//   client_id: "116403685712161920155",
//   auth_uri: "https://accounts.google.com/o/oauth2/auth",
//   token_uri: "https://oauth2.googleapis.com/token",
//   auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//   client_x509_cert_url:
//     "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-rcogp%40dev-ons.iam.gserviceaccount.com",
// };

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
