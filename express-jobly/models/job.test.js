"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "newjob",
    salary: 100,
    equity: 0.5,
    company_handle: "c2"
  };
  const badJob = {
    title: "badJob",
    salary: 100,
    equity: 0.5,
    company_handle: "none"
  };


  test("works", async function () {
    let job = await Job.create(newJob);
    console.log(job)
    expect(job).toEqual(
      {
        id: job.id,
        title: "newjob",
        salary: 100,
        equity: '0.5',
        company_handle: "c2"
      }
    );

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [job.id]);
    expect(result.rows).toEqual(
      [{
        id: job.id,
        title: "newjob",
        salary: 100,
        equity: '0.5',
        company_handle: "c2"
      }]
    );
  });

  test("bad request if company_handle doesnt exist", async function () {
    try {
      await Job.create(badJob);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: '0.5',
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: null,
        equity: null,
        company_handle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 50,
        equity: '1',
        company_handle: "c3",
      },
    ]);
  });

//   test("works: With name Filter", async function () {
//     let companies = await Company.findAll({name:"c1"});
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//     ]);
//   });

//   test("works: With minEmployee Filter", async function () {
//     let companies = await Company.findAll({minEmployees:"2"});
//     expect(companies).toEqual([
//       {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       },
//       {
//         handle: "c3",
//         name: "C3",
//         description: "Desc3",
//         numEmployees: 3,
//         logoUrl: "http://c3.img",
//       },
//     ]);
//   });

//   test("works: With maxEmployee Filter", async function () {
//     let companies = await Company.findAll({maxEmployees:"2"});
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//       {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       },
//     ]);
//   });

//   test("does not work: wrong query variable naming", async function () {
//     try{
//       let companies = await Company.findAll({badName:"c1"});
//     }
//     catch(e){
//       expect( e instanceof BadRequestError).toBeTruthy();
//     }
//   });
});

// /************************************** get */

describe("get", function () {
  const newJob = {
    title: "newjob",
    salary: 100,
    equity: 0.5,
    company_handle: "c2"
  };
  
  
  test("works", async function () {
    let jobInsert = await Job.create(newJob);
    let job = await Job.get(jobInsert.id);

    expect(job).toEqual({
      id: expect.any(Number),
      title: "newjob",
      salary: 100,
      equity: '0.5',
      company_handle: "c2"
    });
  });

  test("not found if no such Job", async function () {
    try {
      await Job.get(1000000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const newJob = {
    title: "newjob",
    salary: 100,
    equity: 0.5,
    company_handle: "c1"
  };
  const updateData = {
    title: "updatedTitle",
    salary: 1,
    equity: 0.1
  };

  test("works", async function () {
    let jobInsert = await Job.create(newJob);
    let job = await Job.update(jobInsert.id, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "updatedTitle",
      salary: 1,
      equity: '0.1',
      company_handle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [job.id]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "updatedTitle",
      salary: 1,
      equity: '0.1',
      company_handle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    let jobInsert = await Job.create(newJob);
    const updateDataSetNulls = {
      title: "updatedTitle",
      salary: null,
      equity: null
    };

    let job = await Job.update(jobInsert.id, updateDataSetNulls);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "updatedTitle",
      salary: null,
      equity: null,
      company_handle: "c1"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE id = $1`, [job.id]);

    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "updatedTitle",
      salary: null,
      equity: null,
      company_handle: "c1"
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(100000000, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    let jobInsert = await Job.create(newJob);
    try {
      await Job.update(jobInsert.id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  const newJob = {
    title: "newjob",
    salary: 100,
    equity: 0.5,
    company_handle: "c1"
  };
  test("works", async function () {
    let jobInsert = await Job.create(newJob);
    await Job.remove(jobInsert.id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id = $1", [jobInsert.id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(1000000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
