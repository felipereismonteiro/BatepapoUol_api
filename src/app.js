import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

await mongoClient.connect()
db = mongoClient.db("messages");


app.get("/messages", async (req, res) => {
  const limite = req.query.limit;
  const buscandoMensagens = db.collection("messages").find().toArray();

  try {
    const mensagens = await buscandoMensagens
    res.send(mensagens.slice(0, limite ? limite : mensagens.length));
  } catch (err) {
    console.log(err)
  } 

  //Precisa filtrar as mensagens privadas para que apenas o usuario enviado receba
});

app.post("/messages", async (req, res) => {
  try {
    await db.collection("messages").insertOne(req.body)
    res.sendStatus(201)
  } catch (err) {
    res.sendStatus(400)
  }
});

app.listen(5000, () => console.log("Server running on port: 5000"));
