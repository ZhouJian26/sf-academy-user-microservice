"use strict";
const PROTO_PATH = __dirname + "/../sf-academy-proto/src/user.proto";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const mysql = require("mysql");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const dotenv = require("dotenv").config();

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: false,
  oneofs: true,
});

const user_proto = grpc.loadPackageDefinition(packageDefinition).user;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 10,
});

const generateJWT = ({ id }) =>
  jwt.sign({ id: id }, process.env.JWT_KEY, { expiresIn: 60 * 60 * 24 * 365 });

const signupService = require("./services/signup");
const loginService = require("./services/login");
const depositService = require("./services/deposit");
const withdrawService = require("./services/withdraw");
const buyService = require("./services/buy");

const services = {
  signup: (call, callback) => {
    const { email, password, username, iban } = call.request;
    if (
      email == undefined ||
      password == undefined ||
      username == undefined ||
      iban == undefined
    )
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Missing values",
      });
    signupService(
      pool,
      grpc.status,
      email,
      crypto.createHash("sha256").update(password).digest("hex"),
      username,
      iban
    )
      .then((data) => {
        console.log(data);
        callback(null, { token: generateJWT(data) });
      })
      .catch((e) => callback(e));
  },
  login: (call, callback) => {
    const { email, password } = call.request;
    if (email == undefined || password == undefined)
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Missing values",
      });
    loginService(
      pool,
      grpc.status,
      email,
      crypto.createHash("sha256").update(password).digest("hex")
    )
      .then((data) => callback(null, { token: generateJWT(data) }))
      .catch((e) => callback(e));
  },
  deposit: (call, callback) => {
    const { user_id, currency, amount } = call.request;
    if (
      (user_id == undefined || currency == undefined || amount == undefined) &&
      amount > 0
    )
      return callback({ code: grpc.status.INVALID_ARGUMENT });
    depositService(pool, grpc.status, user_id, amount, currency)
      .then(() => callback(null, {}))
      .catch((e) => callback(e));
  },
  withdraw: (call, callback) => {
    const { user_id, currency, amount } = call.request;
    if (
      (user_id == undefined || currency == undefined || amount == undefined) &&
      amount > 0
    )
      return callback({ code: grpc.status.INVALID_ARGUMENT });
    withdrawService(pool, grpc.status, user_id, amount, currency)
      .then(() => callback(null, {}))
      .catch((e) => callback(e));
  },
  buy: (call, callback) => {
    const { user_id, srcCurrency, destCurrency, amount } = call.request;
    if (
      (user_id == undefined ||
        srcCurrency == undefined ||
        destCurrency == undefined ||
        amount == undefined) &&
      amount > 0
    )
      return callback({ code: grpc.status.INVALID_ARGUMENT });
    buyService(
      pool,
      grpc.status,
      user_id,
      srcCurrency,
      destCurrency,
      1.1, //todo fetch from exchange service
      amount
    )
      .then(() => callback(null, {}))
      .catch((e) => callback(e));
  },
  listTransactions: (call, callback) => {
    const { user_id, queries } = call.request;
    // Execute on parallel all queries, then concat
    // KO return error
    // OK return results
  },
  verifyJWT: (call, callback) => {
    const { token } = call.request;
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err)
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: err.name + ": " + err.message,
        });
      callback(null, {});
    });
  },
};

(function main() {
  const server = new grpc.Server();
  server.addService(user_proto.User.service, services);
  server.bind("0.0.0.0:9001", grpc.ServerCredentials.createInsecure());
  server.start();
})();
