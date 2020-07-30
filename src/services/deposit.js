module.exports = (pool, grpcStatus, user_id, callRequest) =>
  new Promise((res, rej) => {
    const { currency, amount } = callRequest;
    if (currency == undefined || amount == undefined || amount < 0)
      return rej({ code: grpcStatus.INVALID_ARGUMENT });

    addAmountIntoPortfolio(pool, grpcStatus, amount, user_id, currency)
      .then(({ affectedRows }) =>
        affectedRows != 0
          ? {}
          : createPortfolio(pool, grpcStatus, user_id, currency, amount)
      )
      .then(() => res({}))
      .catch((e) => rej(e));
  });

const addAmountIntoPortfolio = (pool, grpcStatus, amount, user_id, currency) =>
  new Promise((res, rej) => {
    const query = `UPDATE ${process.env.DB_DATABASE}.virtual_portfolio SET balance = balance + ? WHERE user_id = ? AND currency = ?;`;
    pool.query(query, [amount, user_id, currency], (err, results) => {
      if (err)
        return rej({
          code: grpcStatus.UNAVAILABLE,
          message: err.sqlMessage,
        });
      res({ affectedRows: results.affectedRows });
    });
  });

const createPortfolio = (pool, grpcStatus, user_id, currency, amount) =>
  new Promise((res, rej) => {
    const query = `INSERT INTO ${process.env.DB_DATABASE}.virtual_portfolio (user_id, currency, balance) VALUES (?, ?, ?);`;
    pool.query(query, [user_id, currency, amount], (err, results) => {
      if (err)
        return rej({
          code: grpcStatus.UNAVAILABLE,
          message: err.sqlMessage,
        });
      res({});
    });
  });
