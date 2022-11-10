import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";
import dayjs from "dayjs";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let dbMessages;
let dbParticipants;

await mongoClient.connect();
dbMessages = mongoClient.db("messages");
dbParticipants = mongoClient.db("participants");

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const mensagemEntrada = {
    from: name,
    to: "Todos",
    text: "entra na sala...",
    type: "status",
    time: dayjs().format("DD/MM/YYYY"),
  };

  const schema = Joi.object({
    name: Joi.string().required(),
    lastStatus: Joi.required(),
  });

  const participantes = await dbParticipants
    .collection("participants")
    .find()
    .toArray();

  try {
    const usuario = await schema.validateAsync({
      name,
      lastStatus: Date.now(),
    });

    if (participantes.find((p) => p.name === usuario.name)) {
      console.log("Usuario em uso!!!");
      return res.sendStatus(409);
    }

    await dbParticipants.collection("participants").insertOne(usuario);
    await dbParticipants.collection("participants").insertOne(mensagemEntrada);

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(422);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participantes = await dbParticipants
      .collection("participants")
      .find()
      .toArray();
    res.send(participantes);
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
    console.log(err);
  }

  //Precisa filtrar as mensagens privadas para que apenas o usuario enviado receba
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;
  const mensagem = { from, to, text, type, time: dayjs().format("MM/DD/YYYY") };
  const participantes = await dbParticipants
    .collection("participants")
    .find()
    .toArray();

  const schema = Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required(),
    from: Joi.string().required(),
    type: Joi.string().valid("message", "private_message").required(),
    time: Joi.required(),
  });

  try {
    const participante = await dbParticipants
      .collection("participants")
      .find({ name: from })
      .toArray();
    const validate = await schema.validateAsync({
      ...mensagem,
      from: participante.length === 1 && from
    });

    await dbMessages.collection("messages").insertOne(validate);
    res.sendStatus(201);
  } catch (err) {
    res.status(422).send(err.details[0].message);
  }
});

app.listen(5000, () => console.log("Server running on port: 5000"));
