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

const auth = (token) =>
  new Promise((res, rej) => {
    jwt.verify(token[0], process.env.JWT_KEY, (err, decoded) => {
      if (err)
        return rej({
          code: grpc.status.PERMISSION_DENIED,
          message: err.name + ": " + err.message,
        });
      res({ decoded: decoded });
    });
  });

const exchangeMicroservice = require("./other/exchange");

const signupService = require("./services/signup");
const loginService = require("./services/login");
const depositService = require("./services/deposit");
const withdrawService = require("./services/withdraw");
const buyService = require("./services/buy");
const listTransactionsService = require("./services/listTransactions");

const services = {
  signup: (call, callback) => {
    const { email, password, username, iban } = call.request;
    if (
      email == undefined ||
      password == undefined ||
      username == undefined ||
      iban == undefined ||
      email == "" ||
      password == "" ||
      iban == "" ||
      username == ""
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
    auth(call.metadata.get("token"))
      .then(({ decoded }) =>
        depositService(pool, grpc.status, decoded.id, call.request)
      )
      .then(() => callback(null, {}))
      .catch((e) => callback(e));
  },
  withdraw: (call, callback) => {
    auth(call.metadata.get("token"))
      .then(({ decoded }) =>
        withdrawService(pool, grpc.status, decoded.id, call.request)
      )
      .then(() => callback(null, {}))
      .catch((e) => callback(e));
  },
  buy: (call, callback) => {
    auth(call.metadata.get("token")) //get rate from exchange micro
      .then(({ decoded }) => {
        const { srcCurrency, destCurrency, amount } = call.request;
        return new exchangeMicroservice(process.env.EXCHANGE_MICROSERVICE_URL)
          .getExchange(amount, srcCurrency, destCurrency, grpc.status)
          .then(({ value, rate }) => ({
            user_id: decoded.id,
            rate: rate,
            value: value,
            srcCurrency: srcCurrency,
            destCurrency: destCurrency,
            amount: amount,
          }));
      })
      .then((data) => buyService(pool, grpc.status, data))
      .then((data) => callback(null, data))
      .catch((e) => callback(e));
  },
  listTransactions: (call, callback) => {
    auth(call.metadata.get("token"))
      .then(({ decoded }) =>
        listTransactionsService(pool, grpc.status, decoded.id, call.request)
      )
      .then((results) => callback(null, { transactions: results }))
      .catch((e) => callback(e));
  },
};

(function main() {
  const server = new grpc.Server();
  server.addService(user_proto.User.service, services);
  server.bind("0.0.0.0:9001", grpc.ServerCredentials.createInsecure());
  server.start();
})();
