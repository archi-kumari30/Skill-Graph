const neo4j = require('neo4j-driver');

const uri = process.env.COGNODB_URI;
const username = process.env.COGNODB_USERNAME;
const password = process.env.COGNODB_PASSWORD;

let driver = null;

const connectCognoDB = async () => {
  if (!uri || !username || !password) {
    console.log("CognoDB is not fully configured (missing COGNODB_URI, COGNODB_USERNAME, or COGNODB_PASSWORD)");
    return null;
  }

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    // Verify connection by running a check query
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    console.log("CognoDB Connected: true");
    return driver;
  } catch (error) {
    console.error("CognoDB connection failed:", error.message);
    driver = null;
    throw error;
  }
};

const getSession = () => {
  if (!driver) {
    throw new Error("CognoDB driver is not initialized. Please verify your environment configurations.");
  }
  return driver.session();
};

const closeDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};

module.exports = {
  connectCognoDB,
  getSession,
  closeDriver,
  getDriver: () => driver
};
