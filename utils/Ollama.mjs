import ollama from 'ollama'
import fs from 'fs'

class Ollama {

    static async chatSqlCoder(prompt) {
        const allResponses = [];
        const metadata = this._getSQLCoderMetaData()
        const commomQuery = this._getSQLCoderCommomQuery({ prompt, metadata })
        console.log('Commomquery: ', commomQuery)
        for (let i = 0; i <= 0; i++) {
            const response = await ollama.generate({
                model: 'pxlksr/defog_sqlcoder-7b-2:Q4_K_M',
                prompt: commomQuery,
                stream: false,
                options: {
                    "temperature": parseFloat(`0.${i}`)
                }
            })
            //console.log(`Request ${i}: ${response.response}`)
            allResponses.push(response.response)
        }
        //console.log("All responses: ", allResponses.join(", "))
        return allResponses
    }

    static async chatLlama3WithMermaid(jsonData) {
        const llamaMermaidPrompt = this._getMermaidJSONInstructionQuery(jsonData)
        const response = await ollama.generate({
            model: 'llama3:latest',
            prompt: llamaMermaidPrompt,
            stream: false,
        })
        return response
    }

    static async chatLlama3WithData({ data, question }) {
        const prompt = this._getLamma3AnswerInstructionQuery(data, question)
        const response = await ollama.generate({
            model: 'llama3:latest',
            prompt: prompt,
            stream: false,
        })
        return response
    }

    static _getSQLCoderMetaData() {
        try {
            return fs.readFileSync("./metadata_sqlCoder.txt", 'utf8');
        } catch (erro) {
            console.error('Erro ao ler o arquivo:', erro);
            return null;
        }
    }

    static _getSQLCoderCommom
    static _getSQLCoderCommomQuery({ prompt, metadata }) {
        return `### Task
        Generate a SQL Server query to answer [QUESTION]{${prompt}}[/QUESTION]
        
        ### Instructions
        - If you cannot answer the question with the available database schema, return 'I do not know'
        - The generated query must be in SQL Server Syntax
        
        ### Database Schema
        The query will run on a database with the following schema:
        {${metadata}}
        
        ### Answer
        Given the database schema, here is the SQL query that answers [QUESTION]{${prompt}}[/QUESTION]
        [SQL]`
    }
    static _getMermaidJSONInstructionQuery(json) {
        return `## GOAL
        You will receive some data in JSON. Its goal is to read this data and create a syntax according to the standards of the Mermaid.js javascript library.
        
        ##METADATA
        The syntax model (METADATA) is exactly the same as the following example: (
        pie title ExampleTitleName
             "Example1": 20
             "Example2": 40
             "Example3": 60
        )
        
        ##TASK
        Based on the example template syntax I provided you, read the JSON I'm sending you. You must transform the JSON data into the metadata model syntax. 
        Be carefull, you can't return a JSON, you have to format json to metadata example. 
        When defining the name for the chart, do not change the part that says "pie title", just change the "ExampleTitleName" part appropriately for the context.
        
        ##JSON (to compare with metadata)
        
        ${JSON.stringify(json)}
        
        ##RESPONSE
        You must always respond to me ONLY with the metadata syntax, and no other words. I'm waiting for the syntax model.`
    }
    static _getLamma3AnswerInstructionQuery(json, question) {
        return `## GOAL
        You will receive some data in JSON and a question. Its goal is to read this data and answer the question. Try to answer me like a company employee.
        
        
        ##TASK
        Based on the instructions, try to create a answer for the question reading the data present in the JSON.
        
        ##JSON (to compare with the question)
        
        ${JSON.stringify(json)}

        ##QUESTION (to compare with the JSON)
        
        ${question}

        ##RESPONSE
        You must always respond like the employee person, using commom words, without codes syntaxes.`
    }
}

export default Ollama