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

(function main() {
  const client = new user_proto.User(
    "localhost:9001",
    grpc.credentials.createInsecure()
  );
  client.signup(
    {
      email: "test@mail.com",
      password: "my pw ye!",
      username: "pollo pino",
      iban: "my ibam 0000",
    },
    (err, response) => {
      if (err) return console.log(err);
      console.log(response);
    }
  );
})();
(function main() {
  const client = new user_proto.User(
    "localhost:9001",
    grpc.credentials.createInsecure()
  );
  client.login(
    {
      email: "test@mail.com",
      password: "my pw ye!",
    },
    (err, response) => {
      if (err) return console.log(err);
      console.log(response);
    }
  );
})();
(function main() {
  const client = new user_proto.User(
    "localhost:9001",
    grpc.credentials.createInsecure()
  );
  const metadata = new grpc.Metadata();
  metadata.add(
    "token",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTk2MTA3MTUwLCJleHAiOjE2Mjc2NDMxNTB9.ZCxvsJQngIwxi-9CW4KZ2fEcLN-cMqF67LEfKeSCKGQ"
  );
  client.deposit(
    {
      user_id: 1,
      currency: "EUR",
      amount: 10,
    },
    metadata,
    (err, response) => {
      if (err) return console.log(err);
      console.log(response);
    }
  );
})();
