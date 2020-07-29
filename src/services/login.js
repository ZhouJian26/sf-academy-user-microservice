module.exports = (pool, grpcStatus, email, password) =>
  new Promise((res, rej) => {
    const query = `SELECT id FROM ${process.env.DB_DATABASE}.user WHERE email = ? AND password = ?;`;
    pool.query(query, [email, password], (err, results) => {
      if (err || results.length == 0)
        return rej({
          code: err ? grpcStatus.UNAVAILABLE : grpcStatus.NOT_FOUND,
          message: err
            ? err.sqlMessage
            : "Wrong credentials or account doesn't exist.",
        });
      res({ id: results[0].id });
    });
  });
