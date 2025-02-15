require("dotenv").config();
const { Pool } = require("pg");

const proConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(proConfig);

//create countmember table if not there
const createCountMemberTable = async () => {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS countmember(memberjid text , groupjid text, count integer, PRIMARY KEY (memberjid, groupjid));"
  );
};

module.exports.getCountGroupMembersTM = async (groupJid) => {
  await createCountMemberTable();
  let result = await pool.query(
    "SELECT DISTINCT memberJid,count FROM countmember WHERE groupJid=$1 ORDER BY count DESC;",
    [groupJid]
  );
  if (result.rowCount) {
    return result.rows;
  } else {
    return [];
  }
};

module.exports.getCountTopTM = async () => {
  await createCountMemberTable();
  let result = await pool.query(
    "SELECT DISTINCT memberJid,SUM(count) as count FROM countmember GROUP BY memberJid ORDER BY count DESC LIMIT 20;"
  );
  if (result.rowCount) {
    return result.rows;
  } else {
    return [];
  }
};

module.exports.getCountGroupsTM = async () => {
  await createCountMemberTable();
  let result = await pool.query(
    "SELECT groupJid,SUM(count) as count FROM countmember GROUP BY groupJid ORDER BY count DESC;"
  );
  if (result.rowCount) {
    return result.rows;
  } else {
    return [];
  }
};

module.exports.setCountMemberTM = async (memberJid, groupJid) => {
  if (!groupJid.endsWith("@g.us")) return;
  await createCountMemberTable();

  //check if groupjid is present in DB or not
  let result = await pool.query(
    "select * from countmember WHERE memberjid=$1 AND groupjid=$2;",
    [memberJid, groupJid]
  );

  //present
  if (result.rows.length) {
    let count = result.rows[0].count;

    await pool.query(
      "UPDATE countmember SET count = count+1 WHERE memberjid=$1 AND groupjid=$2;",
      [memberJid, groupJid]
    );
    await pool.query("commit;");
    return count + 1;
  } else {
    await pool.query("INSERT INTO countmember VALUES($1,$2,$3);", [
      memberJid,
      groupJid,
      1,
    ]);
    await pool.query("commit;");
    return 1;
  }
};
