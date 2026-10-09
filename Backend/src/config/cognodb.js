const neo4j = require('neo4j-driver');
const config = require('./config');

let driver = null;

const connectCognoDB = async () => {
  const uri = config.cognodbUri;
  const username = config.cognodbUsername;
  const password = config.cognodbPassword;

  if (!uri || !username || !password) {
    console.log("CognoDB is not fully configured (missing COGNODB_URI, COGNODB_USERNAME, or COGNODB_PASSWORD)");
    return null;
  }

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      connectionTimeout: 4000,
      maxConnectionPoolSize: 25,
      connectionAcquisitionTimeout: 3000
    });
    // Verify connection by running a check query with a timeout session
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    console.log("CognoDB Connected: true");
    return driver;
  } catch (error) {
    console.warn("CognoDB connection notice:", error.message);
    if (driver) {
      await driver.close().catch(() => {});
    }
    driver = null;
    return null;
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
