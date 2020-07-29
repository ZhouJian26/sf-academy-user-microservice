module.exports = (pool, grpcStatus, user_id, amount, currency) =>
  new Promise((res, rej) => {
    const substractAmountIntoVirtualPortfolioQuery = `UPDATE ${process.env.DB_DATABASE}.virtual_portfolio SET balance = balance - ? WHERE user_id = ? AND currency = ?;`;
    pool.query(
      substractAmountIntoVirtualPortfolioQuery,
      [amount, user_id, currency],
      (err, results) => {
        if (err || results.affectedRows == 0)
          return rej({
            code: err ? grpcStatus.UNAVAILABLE : grpcStatus.NOT_FOUND,
            message: err ? err.sqlMessage : "Virtual portfolio not found",
          });
        res({});
      }
    );
  });
