module.exports = (pool, grpcStatus, email, password, username, iban) =>
  new Promise((res, rej) => {
    pool.getConnection((err, connection) => {
      if (err)
        return rej({
          code: grpcStatus.UNAVAILABLE,
          message: err.sqlMessage,
        });

      connection.beginTransaction((err) => {
        if (err)
          return connection.rollback(() => {
            connection.release();
            rej({
              code: grpcStatus.ABORTED,
              message: err.sqlMessage,
            });
          });

        const addUserQuery = `INSERT INTO ${process.env.DB_DATABASE}.user (email, password, username) VALUES (?, ?, ?);`;
        connection.query(
          addUserQuery,
          [email, password, username],
          (err, results) => {
            if (err)
              return connection.rollback(() => {
                connection.release();
                rej({
                  code: grpcStatus.ABORTED,
                  message: err.sqlMessage,
                });
              });

            const { insertId } = results;
            const addIbanQuery = `INSERT INTO ${process.env.DB_DATABASE}.bank_account (user_id, iban) VALUES (?, ?);`;
            connection.query(addIbanQuery, [insertId, iban], (err, results) => {
              if (err)
                return connection.rollback(() => {
                  connection.release();
                  rej({
                    code: grpcStatus.ABORTED,
                    message: err.sqlMessage,
                  });
                });

              connection.commit((err) => {
                if (err)
                  return connection.rollback(() => {
                    connection.release();
                    rej({
                      code: grpcStatus.ABORTED,
                      message: err.sqlMessage,
                    });
                  });
                connection.release();
                return res({ message: "Success operation", code: 200 });
              });
            });
          }
        );
      });
    });
  });
