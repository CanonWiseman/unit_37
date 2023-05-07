const { sqlForPartialUpdate } = require('./sql');

describe("sqlForPartialUpdate", function (){
    test("associates sql appropriately", function(){
        const res = sqlForPartialUpdate({firstName: 'Aliya', age: 32}, {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
          });

        expect(res).toEqual({ setCols: '"first_name"=$1, "age"=$2', values: [ 'Aliya', 32 ] })
    });

});