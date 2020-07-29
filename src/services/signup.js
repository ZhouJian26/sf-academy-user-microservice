module.exports = (pool, grpcStatus, email, password, username, iban) =>
  new Promise((res, rej) => {
    pool.getConnection((err, connection) => {
      if (err)
        return rej({
          code: grpcStatus.UNAVAILABLE,
          message: err.sqlMessage,
        });
      startTransaction(connection, grpcStatus)
        .then(() => addUser(connection, grpcStatus, email, password, username))
        .then(({ user_id }) => addIban(connection, grpcStatus, user_id, iban))
        .then(({ user_id }) => commit(connection, grpcStatus, user_id))
        .then(({ user_id }) => {
          connection.release();
          res({ id: user_id });
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

const addUser = (connection, grpcStatus, email, password, username) =>
  new Promise((res, rej) => {
    const query = `INSERT INTO ${process.env.DB_DATABASE}.user (email, password, username) VALUES (?, ?, ?);`;
    connection.query(query, [email, password, username], (err, results) => {
      if (err)
        return rej({
          code: grpcStatus.ABORTED,
          message: err.sqlMessage,
        });
      res({ user_id: results.insertId });
    });
  });

const addIban = (connection, grpcStatus, user_id, iban) =>
  new Promise((res, rej) => {
    const query = `INSERT INTO ${process.env.DB_DATABASE}.bank_account (user_id, iban) VALUES (?, ?);`;
    connection.query(query, [user_id, iban], (err, results) => {
      if (err)
        return rej({
          code: grpcStatus.ABORTED,
          message: err.sqlMessage,
        });
      res({ user_id: user_id });
    });
  });

const commit = (connection, grpcStatus, user_id) =>
  new Promise((res, rej) => {
    connection.commit((err) => {
      if (err)
        return rej({
          code: grpcStatus.ABORTED,
          message: err.sqlMessage,
        });
      res({ user_id: user_id });
    });
  });
