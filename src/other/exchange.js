const PROTO_PATH = __dirname + "/../../sf-academy-proto/src/exchange.proto";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");

const exchangePackageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const exchange_proto = grpc.loadPackageDefinition(exchangePackageDefinition)
  .exchange;

function ExchangeMicroservice(url) {
  this.client = new exchange_proto.Exchange(
    url,
    grpc.credentials.createInsecure()
  );
}

ExchangeMicroservice.prototype.getExchange = function getExchange(
  value,
  from,
  to
) {
  return new Promise((res, rej) => {
    this.client.exchange(
      { value: value, from: from, to: to },
      (err, response) => (err ? rej(err) : res(response))
    );
  });
};

module.exports = ExchangeMicroservice;
