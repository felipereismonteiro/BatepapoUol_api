import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("messages");
});

app.get("/messages", (req, res) => {
  const limit = req.query.limit;
  const buscandoMensagens = db.collection("messages").find().toArray();

  buscandoMensagens.then((mensagens) => {
    return res.send(mensagens.slice(0, limit ? limit : mensagens.length));
  });

  //Precisa filtrar as mensagens privadas para que apenas o usuario enviado receba
});

app.post("/messages", (req, res) => {
  db.collection("messages").insertOne(req.body).then(() => {
    res.sendStatus(201)
  })
});

app.listen(5000, () => console.log("Server running on port: 5000"));
