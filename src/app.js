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
let db;

await mongoClient.connect();
db = mongoClient.db("messages");

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

  const participantes = await db
    .collection("messages")
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

    await db.collection("messages").insertOne(usuario);
    await db.collection("messages").insertOne(mensagemEntrada);

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(422);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participantes = await db
      .collection("messages")
      .find()
      .toArray();
    res.send(participantes.filter(p => p.name));
  } catch (err) {
    console.log(err);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;
  const mensagem = { from, to, text, type, time: dayjs().format("DD/MM/YYYY") };

  const schema = Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required(),
    from: Joi.string().required(),
    type: Joi.string().valid("message", "private_message").required(),
    time: Joi.required(),
  });

  try {
    const participante = await db
      .collection("messages")
      .find({ name: from })
      .toArray();
    const validate = await schema.validateAsync({
      ...mensagem,
      from: participante.length === 1 && from
    });

    await db.collection("messages").insertOne(validate);
    res.sendStatus(201);
  } catch (err) {
    res.status(422).send(err.details[0].message);
  }
});

app.get("/messages", async (req, res) => {
  const limite = req.query.limit;
  const usuario = req.headers.user;

  try {
    const mensagens = await db.collection("messages").find().toArray();
    res.send(
      mensagens
        .filter((m) => m.to === usuario || m.to === "Todos" || m.to === m.to)
        .slice(0, limite ? limite : mensagens.length)
    );
  } catch (err) {
    console.log(err);
  }
});

app.listen(5000, () => console.log("Server running on port: 5000"));
