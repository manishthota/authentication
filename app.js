const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let dataBase = null;

const initializeDataBaseAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at localhost 3000");
    });
  } catch (error) {
    console.log("error");
    process.exit(1);
  }
};
initializeDataBaseAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const dbUserQuery = `
  select * from user where
  username='${username}'
  `;
  const dbUser = await dataBase.get(dbUserQuery);
  if (dbUser === undefined) {
    //user not exist
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const dbRequest = `
        insert into user(username, name, password, gender, location)
        values('${username}','${name}','${hashedPassword}','${gender}','${location}')
        `;
      const dbResponse = await dataBase.run(dbRequest);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//creating API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const dbUserQuery = `
  select * from user where
  username='${username}'
  `;
  const dbUser = await dataBase.get(dbUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(password, dbUser.password);
    if (passwordMatch) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//creating API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const dbUserQuery = `
  select * from user where
  username='${username}'
  `;
  const dbUser = await dataBase.get(dbUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (passwordMatch) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `
            update user
            set 
            password='${hashedPassword}'
            where
            username='${username}'
      `;

        const dataUser = await dataBase.run(updateQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
