const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function getUser(username) {
  const user = users.find((user) => user.username === username);
  return user;
}

function checksToDoBelongsToUser(request, response, next) {
  const { username } = request.headers;
  const id = request.params.id;
  const user = getUser(username);
  const toDoBelongsUser = user.todos.find((todo) => todo.id === id);
  if (!toDoBelongsUser) {
    return response
      .status(400)
      .json(`Task not owned by the username ${username}`);
  }
  next();
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);
  if (!user) {
    return response.status(400).json(`Username ${username} not exists`);
  }
  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.find((user) => user.username === username);

  if (userAlreadyExists) {
    return response
      .status(400)
      .json({ error: `Username ${username} already exists` });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };
  users.push(user);
  return response.status(201).send(user);
});

app.get("/users", (request, response) => {
  return response.json(users);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const user = getUser(username);
  return response.status(201).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const user = getUser(username);
  const { title, deadline } = request.body;
  const toDo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };
  user.todos.push(toDo);
  return response.status(201).json(toDo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;
  const { title, deadline } = request.body;
  const user = getUser(username);
  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: "ToDo not foundf" });
  }

  todo.title = title;
  todo.deadline = new Date(deadline);
  return response.status(201).json(todo);
});

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,

  (request, response) => {
    const { username } = request.headers;
    const { id } = request.params;
    const user = getUser(username);
    const todo = user.todos.find((todo) => todo.id === id);

    if (!todo) {
      return response.status(404).json({ error: "ToDo not foundf" });
    }

    todo.done = true;

    return response.status(201).json(todo);
  }
);

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;
  const user = getUser(username);
  const todoIndex = user.todos.findIndex((todo) => todo.id === id);

  if (todoIndex === -1) {
    return response.status(404).json({ error: "ToDo not foundf" });
  }

  user.todos.splice(todoIndex, 1);
  return response.status(204).send();
});

module.exports = app;
