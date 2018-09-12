const sqlite = require('sqlite');

class Manifest {

    constructor(path) {

        sqlite.open(path).then(db => {
            /**
             *
             * @type {Database}
             */
            this.db = db;
        })
    }

    /**
     *
     * @param {DamageType} id
     * @return {{displayProperties:{name:string,icon:string}}}
     */
    damageType(id) {
        return this.getRecord('DestinyDamageTypeDefinition', id)
    }

    makeStatement = _.memoize((table) => {
        return this.db.prepare(`select json from ${table} where id = ?`);
    });

    getRecord(table, id) {
        const statement = this.makeStatement(table);
        // The ID in sqlite is a signed 32-bit int, while the id we
        // use is unsigned, so we must convert
        const sqlId = new Int32Array([id])[0];
        const result = statement.get([sqlId]);
        statement.reset();
        if (result.length) {
            return JSON.parse(result[0]);
        }
        return null;
    }

    getAllRecords(table) {
        const rows = this.db.exec(`SELECT json FROM ${table}`);
        const result = {};
        rows[0].values.forEach((row) => {
            const obj = JSON.parse(row);
            result[obj.hash] = obj;
        });
        return result;
    }
}