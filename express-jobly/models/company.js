"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * 
   * FILTER: The request handler packs the query variables into an object and sends it to the findAll function
   * The for loop goes through the object and builds an appropriate SQL statement to insert into the statement
   * The insert will always happen but the insert will be blank if nothing is passed into the filtering object so no SQL will be interupted
   * */


  static async findAll(filter = {}) {
    let filterStatement = "";
    let sqlVariables = [];

    let index = 1;
    for (const [key, value] of Object.entries(filter)) {
      if(key != "name" && key != "minEmployees" && key != "maxEmployees"){
        return new BadRequestError("Query Variables invalid", 400);
      }
        
      if(filterStatement != "" && value){
        filterStatement += " AND "; 
      }
      else if(filterStatement == "" && value){
        filterStatement = "WHERE ";
      }

      if(key == "name" && value){
        filterStatement += `LOWER(name) LIKE $${index}`;
        const nameFilter = `%${value.toLowerCase()}%`
        sqlVariables.push(nameFilter);
      }
      else if (key == "minEmployees" && value){
        filterStatement += `num_employees >= $${index}`;
        sqlVariables.push(value);
      }
      else if (key == "maxEmployees" && value){
        filterStatement += `num_employees <= $${index}`;
        sqlVariables.push(value);
      }
      index ++;
    }

    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ${filterStatement}
           ORDER BY name`, sqlVariables);

    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

      const jobRes = await db.query(
        `SELECT id,
                title,
                salary,
                equity,
                company_handle
        FROM jobs
        WHERE company_handle = $1`,
        [handle]);
      
      const jobs = jobRes.rows

    const company = companyRes.rows[0];
    if(jobs){
      company.jobs = jobs;
    }

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
