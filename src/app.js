import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let dbMessages;
let dbParticipants;

await mongoClient.connect()
dbMessages = mongoClient.db("messages");
dbParticipants = mongoClient.db("participants")

app.post("/participants", async (req, res) => { 
  const {name, lastStatus} = req.body
  
  const schema = Joi.object({
    name: Joi.string().required(),
    lastStatus: Joi.number().required()
  })

  try {
    const usuario = await schema.validateAsync({name, lastStatus})
    const participantes = await dbParticipants.collection("participants").find().toArray();

    if(participantes.find(p => p.name === usuario.name )) {
      console.log("Usuario em uso!!!");
      return res.sendStatus(409);
    };


    await dbParticipants.collection("participants").insertOne(usuario)
    res.sendStatus(201)
  } catch (err) {
    console.log(err);
    res.sendStatus(422)
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participantes = await dbParticipants.collection("participants").find().toArray();
    res.send(participantes)
  } catch (err) {
    console.log(err);
  }
});

app.get("/messages", async (req, res) => {
  const limite = req.query.limit;

  try {
    const mensagens = await dbMessages.collection("messages").find().toArray();
    res.send(mensagens.slice(0, limite ? limite : mensagens.length));
  } catch (err) {
    console.log(err)
  } 

  //Precisa filtrar as mensagens privadas para que apenas o usuario enviado receba
});

app.post("/messages", async (req, res) => {
  try {
    await dbMessages.collection("messages").insertOne(req.body)
    res.sendStatus(201)
  } catch (err) {
    res.sendStatus(400)
  }
});

app.listen(5000, () => console.log("Server running on port: 5000"));
