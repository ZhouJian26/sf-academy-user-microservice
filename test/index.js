const PROTO_PATH = __dirname + "/../sf-academy-proto/src/user.proto";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: false,
  oneofs: true,
});
const user_proto = grpc.loadPackageDefinition(packageDefinition).user;

const userData = {
  email: "test@email.com",
  pw: "user pw",
  iban: "user iban",
  username: "user username",
};

const login = (email, pw) =>
  new Promise((res, rej) => {
    const client = new user_proto.User(
      "localhost:9001",
      grpc.credentials.createInsecure()
    );
    client.login(
      {
        email: email,
        password: pw,
      },
      (err, response) => {
        if (err) return rej(err);
        res(response);
      }
    );
  });
const signup = (email, pw, username, iban) =>
  new Promise((res, rej) => {
    const client = new user_proto.User(
      "localhost:9001",
      grpc.credentials.createInsecure()
    );
    client.signup(
      {
        email: email,
        password: pw,
        username: username,
        iban: iban,
      },
      (err, response) => {
        if (err) return rej(err);
        res(response);
      }
    );
  });

const deposit = (token, amount, currency) =>
  new Promise((res, rej) => {
    const client = new user_proto.User(
      "localhost:9001",
      grpc.credentials.createInsecure()
    );
    const metadata = new grpc.Metadata();
    metadata.add("token", token);
    client.deposit(
      {
        amount: amount,
        currency: currency,
      },
      metadata,
      (err, response) => {
        if (err) return rej(err);
        res(response);
      }
    );
  });
const withdraw = (token, amount, currency) =>
  new Promise((res, rej) => {
    const client = new user_proto.User(
      "localhost:9001",
      grpc.credentials.createInsecure()
    );
    const metadata = new grpc.Metadata();
    metadata.add("token", token);
    client.withdraw(
      {
        amount: amount,
        currency: currency,
      },
      metadata,
      (err, response) => {
        if (err) return rej(err);
        res(response);
      }
    );
  });

const buy = (token, amount, srcCurrency, destCurrency) =>
  new Promise((res, rej) => {
    const client = new user_proto.User(
      "localhost:9001",
      grpc.credentials.createInsecure()
    );
    const metadata = new grpc.Metadata();
    metadata.add("token", token);
    client.buy(
      {
        amount: amount,
        srcCurrency: srcCurrency,
        destCurrency: destCurrency,
      },
      metadata,
      (err, response) => {
        if (err) return rej(err);
        res(response);
      }
    );
  });

const listTransactions = (token, queries) =>
  new Promise((res, rej) => {
    const client = new user_proto.User(
      "localhost:9001",
      grpc.credentials.createInsecure()
    );
    const metadata = new grpc.Metadata();
    metadata.add("token", token);
    client.listTransactions(
      {
        queries: queries,
      },
      metadata,
      (err, response) => {
        if (err) return rej(err);
        res(response);
      }
    );
  });

signup(userData.email, userData.pw, userData.username, userData.iban)
  .then((result) => console.log(result))
  .catch((e) => console.log(e));

login(userData.email, userData.pw)
  .then((data) => {
    console.log("Logged - Token: " + data.token);
    return data;
  })
  .then(({ token }) => deposit(token, 200, "EUR").then((result) => token))
  .then((token) => {
    console.log("Deposit 200 EUR");
    return token;
  })
  .then((token) => withdraw(token, 50, "EUR").then((result) => token))
  .then((token) => {
    console.log("Withdraw 50 EUR");
    return token;
  })
  .then((token) => buy(token, 100, "EUR", "USD").then((result) => token))
  .then((token) => {
    console.log("100 EUR => USD");
    return token;
  })
  .then((token) =>
    listTransactions(token, [{ srcCurrency: "EUR" }]).then((result) => {
      console.log(result);
      return token;
    })
  )
  .then((token) => {
    console.log("Transaction list");
    return token;
  })
  .then((result) => console.log(result))
  .catch((e) => console.log(e));
