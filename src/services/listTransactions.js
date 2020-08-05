const sqlMapping = {
  startDate: "T.date",
  endDate: "T.date",
  srcCurrency: "VP1.currency",
  destCurrency: "VP2.currency",
};

const sqlOpMapping = (target) => {
  switch (target) {
    case "currency":
      return "=";
    case "startDate":
      return ">=";
    case "endDate":
      return "<=";
    default:
      return "=";
  }
};

const parseInput = (key, value) => {
  switch (value) {
    case "startDate":
      return new Date(query[key])
        .toISOString()
        .split("T")
        .join(" ")
        .split(":")[0];
    case "endDate":
      return new Date(query[key])
        .toISOString()
        .split("T")
        .join(" ")
        .split(".")[0];
    default:
      return value;
  }
};

module.exports = (pool, grpcStatus, user_id, callRequest) =>
  new Promise((res, rej) => {
    const { queries } = callRequest;
    if (queries == undefined) return rej({ code: grpcStatus.INVALID_ARGUMENT });
    createQuery(pool, queries)
      .then((queryWhere) =>
        getTransactions(pool, grpcStatus, user_id, queryWhere)
      )
      .then((results) => res(results))
      .catch((e) => rej(e));
  });

const createQuery = (pool, queries) =>
  new Promise((res, rej) => {
    res(
      queries
        .map((query) =>
          Object.keys(query)
            .map(
              (key) =>
                `${sqlMapping[key]} ${sqlOpMapping(key)} ${pool.escape(
                  parseInput(key, query[key])
                )}`
            )
            .join(" AND ")
        )
        .join(" OR ")
    );
  });

const getTransactions = (pool, grpcStatus, user_id, queryWhere) =>
  new Promise((res, rej) => {
    query = `SELECT VP1.currency AS srcCurrency, VP2.currency AS destCurrency, T.date, T.amount, T.rate FROM transaction AS T INNER JOIN virtual_portfolio AS VP1 ON T.virtual_portfolio_src_id = VP1.id INNER JOIN virtual_portfolio AS VP2 ON T.virtual_portfolio_dest_id = VP2.id WHERE (VP1.user_id = ? || VP2.user_id = ?)${
      queryWhere == "" ? ";" : ` AND (${queryWhere});`
    }`;
    console.log(query);
    pool.query(query, [user_id, user_id], (err, results) => {
      if (err)
        return rej({ code: grpcStatus.ABORTED, message: err.sqlMessage });
      res(results);
    });
  });
