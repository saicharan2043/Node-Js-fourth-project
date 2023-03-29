const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();

const DBPath = path.join(__dirname, "./userData.db");

app.use(express.json());

let db = null;

const initializationServerAndDB = async () => {
  try {
    db = await open({
      filename: DBPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server is Running"));
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializationServerAndDB();

app.post("/register", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const modifyPassword = await bcrypt.hash(password, 10);
  const userExits = `
        select * from user where username = '${username}' ;
    `;

  const dbResponse = await db.get(userExits);
  console.log(dbResponse);
  if (dbResponse === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newSqlQuery = `
                insert into user(
                    username , name , password , gender , location
                )
                values ('${username}' , '${name}' , '${modifyPassword}' , '${gender}' , '${location}')
            `;
      await db.run(newSqlQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const sqlQuery = `
        select * from user where username = '${username}'
    `;
  const dbResponse = await db.get(sqlQuery);
  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comperePassword = await bcrypt.compare(password, dbResponse.password);
    if (comperePassword) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const sqlQuery = `select * from user where username = '${username}'`;
  const dbResponse = await db.get(sqlQuery);
  const comparePassword = await bcrypt.compare(
    oldPassword,
    dbResponse.password
  );
  if (comparePassword) {
    if (newPassword.length > 5) {
      const newModifyPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = `
                update user set password = '${newModifyPassword}' where username = '${username}'
            `;
      await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
