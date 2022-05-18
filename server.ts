import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

//get all todos
app.get("/", async (req, res) => {
  try {
    const dbres = await client.query('SELECT * FROM todos');
    res.status(200).json(dbres.rows);
  } catch (error) {
    res.status(400)
    console.error(error)
  }

});

//get a todo with a specific id
app.get("/todo/:id", async (req, res)=> {
 try {
  const id = parseInt(req.params.id)
  const query = "SELECT * FROM todos WHERE id = $1"
  const result = await client.query(query, [id])
  res.status(200).json(result.rows)
   
 } catch (error) {
   res.status(400)
   console.error(error)
 }
})

//add a todo
app.post("/todo", async (req, res) => {
  try {
    const {task, done} = req.body
    const query = 'INSERT INTO todos (task, done) VALUES ($1, $2) RETURNING *'
    const result = await client.query(query, [task, done])
    res.status(200).json(result.rows[0])
  } catch (error) {
    res.status(400)
    console.error(error)
  }
})


//edit a todo
app.put("/todo/:id", async(req,res) => {
  try {
    const id = parseInt(req.params.id)
    const {task, done} = req.body;
    const query = 'UPDATE todos SET task = $1, done = $2 WHERE id = $3 RETURNING *'
    const result = await client.query(query, [task, done, id])
    res.status(200).json(result.rows[0])
  } catch (error) {
    res.status(400)
    console.error(error)
  }
})

//delete a todo
app.delete("/todo/:id", async(req,res) => {
 try {
  const id = parseInt(req.params.id)
  const query = "DELETE FROM todos WHERE id = $1"
  const result = await client.query(query, [id])

  if (result.rowCount ===1){
    res.status(200).json({status: "success"})
  }
 } catch (error) {
  res.status(400)
  console.error(error)
 }
})


//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
