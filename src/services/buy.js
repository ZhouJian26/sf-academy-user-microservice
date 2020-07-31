module.exports = (
  pool,
  grpcStatus,
  { user_id, rate, value, srcCurrency, destCurrency, amount }
) =>
  new Promise((res, rej) => {
    pool.getConnection((err, connection) => {
      if (err)
        return rej({
          code: grpcStatus.UNAVAILABLE,
          message: err.sqlMessage,
        });
      startTransaction(connection, grpcStatus)
        .then(() =>
          addAmountIntoPortfolio(
            connection,
            grpcStatus,
            amount * -1,
            user_id,
            srcCurrency
          )
        )
        .then(({ affectedRows }) => {
          if (affectedRows == 1)
            return addAmountIntoPortfolio(
              connection,
              grpcStatus,
              value,
              user_id,
              destCurrency
            );
          throw {
            code: grpcStatus.NOT_FOUND,
            message: "Portfolio not found",
          };
        })
        .then(({ affectedRows }) =>
          affectedRows == 1
            ? {}
            : createPortfolio(
                connection,
                grpcStatus,
                user_id,
                destCurrency,
                value
              )
        )
        .then(() =>
          getPortfolioId(
            connection,
            grpcStatus,
            user_id,
            srcCurrency,
            destCurrency
          )
        )
        .then((portfolioId) =>
          createTransaction(
            connection,
            grpcStatus,
            portfolioId,
            srcCurrency,
            destCurrency,
            amount,
            rate
          )
        )
        .then(() => commit(connection, grpcStatus))
        .then(() => {
          connection.release();
          res({ amount: value });
        })
        .catch((err) => {
          connection.rollback(() => {
            connection.release();
            rej(err);
          });
        });
    });
  });
const startTransaction = (connection, grpcStatus) =>
  new Promise((res, rej) => {
    connection.beginTransaction((err) => {
      if (err)
        return rej({
          code: grpcStatus.ABORTED,
          message: err.sqlMessage,
        });
      res({});
    });
  });
const addAmountIntoPortfolio = (
  connection,
  grpcStatus,
  amount,
  user_id,
  currency
) =>
  new Promise((res, rej) => {
    const query = `UPDATE ${process.env.DB_DATABASE}.virtual_portfolio SET balance = balance + ? WHERE user_id = ? AND currency = ?;`;
    connection.query(query, [amount, user_id, currency], (err, results) => {
      if (err)
        return rej({
          code: grpcStatus.UNAVAILABLE,
          message: err.sqlMessage,
        });
      res({ affectedRows: results.affectedRows });
    });
  });
const createPortfolio = (connection, grpcStatus, user_id, currency, amount) =>
  new Promise((res, rej) => {
    const query = `INSERT INTO ${process.env.DB_DATABASE}.virtual_portfolio (user_id, currency, balance) VALUES (?, ?, ?);`;
    connection.query(query, [user_id, currency, amount], (err, results) => {
      if (err)
        return rej({
          code: grpcStatus.UNAVAILABLE,
          message: err.sqlMessage,
        });
      res({});
    });
  });

const getPortfolioId = (connection, grpcStatus, user_id, curr1, curr2) =>
  new Promise((res, rej) => {
    const query = `SELECT id, currency FROM ${process.env.DB_DATABASE}.virtual_portfolio WHERE user_id = ? AND (currency = ? OR currency = ?)`;
    connection.query(query, [user_id, curr1, curr2], (err, results) => {
      if (err)
        return rej({
          code: grpcStatus.ABORTED,
          message: err.sqlMessage,
        });
      const portfolioId = Object.assign(
        {},
        ...results.map((portfolio) => ({
          [portfolio.currency]: portfolio.id,
        }))
      );
      res(portfolioId);
    });
  });
const createTransaction = (
  connection,
  grpcStatus,
  portfolioId,
  srcCurrency,
  destCurrency,
  amount,
  rate
) =>
  new Promise((res, rej) => {
    const query = `INSERT INTO ${process.env.DB_DATABASE}.transaction (virtual_portfolio_src_id, virtual_portfolio_dest_id, amount, rate) VALUES (?, ?, ?, ?);`;
    connection.query(
      query,
      [portfolioId[srcCurrency], portfolioId[destCurrency], amount, rate],
      (err, results) => {
        if (err)
          return rej({
            code: grpcStatus.ABORTED,
            message: err.sqlMessage,
          });
        res({});
      }
    );
  });

const commit = (connection, grpcStatus) =>
  new Promise((res, rej) => {
    connection.commit((err) => {
      if (err)
        return rej({
          code: grpcStatus.ABORTED,
          message: err.sqlMessage,
        });
      res({});
    });
  });
