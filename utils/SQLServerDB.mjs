import sql from 'mssql'

class SQLServer {
   
    async executeQuery(query){
        try {
            await sql.connect('Server=sistemas.cstservices.com.br,14330;Database=QironBackOffice_Treinamento;User Id=sa;Password=masterkey;Encrypt=false')
            const result = await sql.query(query)
            console.log(result)
            return result
        } catch (err) {
            console.log(err)
        } 
    }

}

export default SQLServer
