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
