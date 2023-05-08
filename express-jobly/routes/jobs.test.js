"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "newjob",
    salary: 100,
    equity: 0.5,
    company_handle: "c2"
  };
  // const newJobResult = {
  //   id: expect.any(Number),
  //   title: "newjob",
  //   salary: 100,
  //   equity: 0.5,
  //   company_handle: "c2"
  // };

  test("not ok for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      },
    });
  });

  test("ok for Admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "newjob",
        salary: 100,
        equity: '0.5',
        company_handle: "c2"
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: 1,
          salary: 100,
          equity: 0.5,
          company_handle: "c2"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "j1",
              salary: 100,
              equity: '0.5',
              company_handle: "c1"
            },
            {
              id: expect.any(Number),
              title: "j2",
              salary: null,
              equity: null,
              company_handle: "c2"
          }
          ],
    });
  });
});

// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  const newJob = {
    title: "newjob",
    salary: 100,
    equity: 0.5,
    company_handle: "c2"
  };
  test("works for anon", async function () {
    const jobInsert = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app).get(`/jobs/${jobInsert.body.job.id}`);
    expect(resp.body).toEqual({
      job: {
        id: jobInsert.body.job.id,
        title: "newjob",
        salary: 100,
        equity: '0.5',
        company_handle: "c2"
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/10000000`);
    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  const newJob = {
    title: "newjob",
    salary: 100,
    equity: 0.5,
    company_handle: "c2"
  };

  test("works for Admins", async function () {
    const jobInsert = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
        .patch(`/jobs/${jobInsert.body.job.id}`)
        .send({
          title: "updated title",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: jobInsert.body.job.id,
        title: "updated title",
        salary: 100,
        equity: '0.5',
        company_handle: "c2"
      },
    });
  });

  test("Does not work for non admin users", async function () {
    const jobInsert = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
        .patch(`/jobs/${jobInsert.body.job.id}`)
        .send({
          title: "Updated title",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      },
    });
  });

  test("not found on no such jobs", async function () {
    const resp = await request(app)
        .patch(`/jobs/10000000`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const jobInsert = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
        .patch(`/jobs/${jobInsert.body.job.id}`)
        .send({
          id: 1,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const jobInsert = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
        .patch(`/jobs/${jobInsert.body.job.id}`)
        .send({
          title: 1234,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  const newJob = {
    title: "newjob",
    salary: 100,
    equity: 0.5,
    company_handle: "c2"
  };

  test("works for Admins", async function () {
    const jobInsert = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
        .delete(`/jobs/${jobInsert.body.job.id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${jobInsert.body.job.id}` });
  });

  test("Does not work for non Admins", async function () {
    const jobInsert = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
        .delete(`/jobs/${jobInsert.body.job.id}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/1000000000`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
