import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
 
const app = express();
app.use(cors());
app.use(express.json());
dotenv.config()

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(()=> {
  db = mongoClient.db("messages")
});

app.get("/", (req, res) => {
  res.send("Porta principal");
});

app.get("/messages", (req, res) => {
  const limit = req.query.limit;

  if (!limit) {
    return res.send("Todas as mensagens devem ser enviadas");
  }

  res.send(`Enviando ${limit} mensagens`);
  // Envie apenas as mensagens que aquele usuario pode receber
});

app.listen(5000, () => console.log("Server running on port: 5000"));
