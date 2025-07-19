import oracledb from "oracledb";
import dotenv from "dotenv";

class DBService {
    constructor(){
        this._configOracleDB()
    }
    async executeQuery(query){
        let connection;
        try {
            oracledb.initOracleClient();
            connection = await oracledb.getConnection(this.dbConfig);
            const result = await connection.execute(query);
            return result.rows;
        } catch (err) {
            console.error(err);
            return null;
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
    _configOracleDB(){
        dotenv.config();
        this.dbConfig = {
            user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			connectionString: process.env.DB_CONNECTION_STRING
        }
    }
}

export default DBService