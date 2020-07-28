module.exports = (pool, grpcStatus, email, password) =>
  new Promise((res, rej) => {
    const query = `SELECT count(*) as c_user FROM ${process.env.DB_DATABASE}.user WHERE email = ? AND password = ?;`;
    pool.query(query, [email, password], (err, results) => {
      if (err)
        return rej({
          code: grpcStatus.UNAVAILABLE,
          message: err.sqlMessage,
        });
      const { c_user } = results[0];
      if (c_user == 1) return res({});
      rej({
        code: grpcStatus.NOT_FOUND,
        message: "Wrong credentials or account doesn't exist.",
      });
    });
  });
