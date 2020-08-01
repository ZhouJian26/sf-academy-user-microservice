module.exports = (pool, grpcStatus, user_id) =>
  new Promise((res, rej) => {
    getVirtualPortfolios(pool, grpcStatus, user_id)
      .then((results) => res(results))
      .catch((e) => rej(e));
  });

const getVirtualPortfolios = (pool, grpcStatus, user_id) =>
  new Promise((res, rej) => {
    const query = `SELECT currency, balance, date FROM ${process.env.DB_DATABASE}.virtual_portfolio WHERE user_id = ?;`;
    pool.query(query, [user_id], (err, results) => {
      if (err)
        return rej({
          code: grpcStatus.UNAVAILABLE,
          message: err.sqlMessage,
        });
      res(results);
    });
  });
