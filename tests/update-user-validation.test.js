// Edge cases for PUT /users/:id beyond the grading tests in update-user.test.js.

const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");

const app = require("../server");

test("PUT /users/:id with a non-string field returns 400", async () => {
  const res = await request(app)
    .put("/users/1")
    .send({ name: "Ada Lovelace", email: 123 });

  assert.strictEqual(res.status, 400);
});

test("PUT /users/:id with a whitespace-only name returns 400", async () => {
  const res = await request(app)
    .put("/users/1")
    .send({ name: "   ", email: "ada@example.com" });

  assert.strictEqual(res.status, 400);
});

test("PUT /users/:id with an empty body returns 400", async () => {
  const res = await request(app).put("/users/1").send({});

  assert.strictEqual(res.status, 400);
});

test("PUT /users/:id with a non-numeric id returns 404", async () => {
  const res = await request(app)
    .put("/users/abc")
    .send({ name: "Nobody", email: "nobody@example.com" });

  assert.strictEqual(res.status, 404);
});

test("PUT /users/:id ignores an id in the body and persists the change", async () => {
  const res = await request(app)
    .put("/users/2")
    .send({ id: 999, name: "Alan M. Turing", email: "alan.turing@example.com" });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.id, 2);

  const fetched = await request(app).get("/users/2");
  assert.strictEqual(fetched.status, 200);
  assert.strictEqual(fetched.body.name, "Alan M. Turing");
  assert.strictEqual(fetched.body.email, "alan.turing@example.com");
});
