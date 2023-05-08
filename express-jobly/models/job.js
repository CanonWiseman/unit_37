"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job{
/** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary(optional), equity(optional), company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   * 
   * Throws bad request if company handle is not in database
   * */
    static async create({ title, salary = null, equity = null, company_handle }) {
        const companyCheck = await db.query(
            `SELECT handle 
            FROM companies
            WHERE handle = $1`,
            [company_handle]);

        if (!companyCheck.rows[0])
        throw new BadRequestError(`Company doesn't exist: ${company_handle}`);

        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle`,
            [
            title,
            salary,
            equity,
            company_handle
            ],
        );
        const job = result.rows[0];

        return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * 
   * FILTER: 
   * */

  static async findAll(filter = {}) {
    let filterStatement = "";
    let sqlVariables = [];

    let index = 1;
    for (const [key, value] of Object.entries(filter)) {
      if(key != "title" && key != "hasEquity" && key != "minSalary"){
        return new BadRequestError("Query Variables invalid", 400);
      }
        
      if(filterStatement != "" && value){
        filterStatement += " AND "; 
      }
      else if(filterStatement == "" && value){
        filterStatement = "WHERE ";
      }

      if(key == "title" && value){
        filterStatement += `LOWER(title) LIKE $${index}`;
        const titleFilter = `%${value.toLowerCase()}%`
        sqlVariables.push(titleFilter);
      }
      else if (key == "minSalary" && value){
        filterStatement += `salary >= $${index}`;
        sqlVariables.push(value);
      }
      else if (key == "hasEquity" && value){
        filterStatement += `equity > 0`;
      }
      index ++;
    }

    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle
           FROM jobs
           ${filterStatement}
           ORDER BY title`, sqlVariables);

    return jobRes.rows;
  }

  /** Given a job title, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT *
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, company_handle}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          title: "title",
          salary: "salary",
          equity: "equity"
        });
    const idVarIdx = "$" + (values.length + 1);
    console.log(idVarIdx);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined. 
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

}

module.exports = Job;
