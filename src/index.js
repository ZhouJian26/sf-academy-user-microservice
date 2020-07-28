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

const signupService = require("./services/signup");
const loginService = require("./services/login");

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
      .then(() => {
        callback(null, { token: "token" });
      })
      .catch((e) => {
        callback(e);
      });
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
      .then(() => {
        callback(null, { token: "token" });
      })
      .catch((e) => {
        callback(e);
      });
  },
  deposit: (call, callback) => {
    const { currency, amount } = call.request;
    if (currency == undefined || amount == undefined) return; //return an error
    // Add amount in the virtual portfolio
    // KO return error
    // OK return 200
  },
  withdraw: (call, callback) => {
    const { currency, amount } = call.request;
    if (currency == undefined || amount == undefined) return; //return an error
    // Substract amount from the virtual portfolio
    // KO return error
    // OK return 200
  },
  buy: (call, callback) => {
    const { srcCurrency, destCurrency, amount } = call.request;
    if (
      srcCurrency == undefined ||
      destCurrency == undefined ||
      amount == undefined
    )
      return; // return an error
    // Substract amount from the virtual portfolio, then add the equivalent into dest virtual portfolio
    // KO return error
    // OK return 200
  },
  listTransactions: (call, callback) => {
    const { queries } = call.request;
    // Execute on parallel all queries, then concat
    // KO return error
    // OK return results
  },
};

(function main() {
  const server = new grpc.Server();
  server.addService(user_proto.User.service, services);
  server.bind("0.0.0.0:9001", grpc.ServerCredentials.createInsecure());
  server.start();
})();
