import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";
import dayjs from "dayjs";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

const schemaPut = Joi.object({
  to: Joi.string().required(),
  from: Joi.string(),
  type: Joi.valid("message", "private_message").required(),
  text: Joi.string(),
});

const schemaPost = Joi.object({
  to: Joi.string().required(),
  text: Joi.string().required(),
  from: Joi.string().required(),
  type: Joi.string().valid("message", "private_message").required(),
  time: Joi.required(),
});

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

  const participantes = await db.collection("messages").find().toArray();

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
    const participantes = await db.collection("messages").find().toArray();
    res.send(participantes.filter((p) => p.name));
  } catch (err) {
    console.log(err);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;
  const mensagem = { from, to, text, type, time: dayjs().format("DD/MM/YYYY") };

  try {
    const participante = await db
      .collection("messages")
      .find({ name: from })
      .toArray();
    const validate = await schemaPost.validateAsync({
      ...mensagem,
      from: participante.length === 1 && from,
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
        .filter(
          (m) => m.to === usuario || m.to === "Todos" || m.from === usuario
        )
        .reverse()
        .slice(0, limite ? limite : mensagens.length)
        .reverse()
    );
  } catch (err) {
    console.log(err);
  }
});

app.post("/status", async (req, res) => {
  const participante = req.headers.user;
  const user = await db.collection("messages").findOne({ name: participante });

  if (!user) {
    res.sendStatus(404);
    return;
  }

  try {
    await db
      .collection("messages")
      .updateOne({ name: participante }, { $set: { lastStatus: Date.now() } });

    setInterval(async () => {
      const participantes = await db.collection("messages").find().toArray();

      const participantesFiltrados = participantes.filter((p) => p.lastStatus);

      participantesFiltrados.forEach(async (element) => {
        if (Date.now() - element.lastStatus >= 10000) {
          await db.collection("messages").deleteOne({ _id: element._id });
          await db.collection("messages").insertOne({
            from: element.name,
            to: "Todos",
            text: "sai da sala...",
            type: "status",
            time: dayjs().format("DD/MM/YYYY"),
          });
        }
      });
    }, 15000);

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(404);
  }
});

app.delete("/messages/:id", async (req, res) => {
  try {
    const mensagens = await db
      .collection("messages")
      .find({ _id: ObjectId(req.params.id) })
      .toArray();
    if (mensagens.length === 0) {
      return res.sendStatus(404);
    } else if (mensagens[0].from !== req.headers.user) {
      return res.sendStatus(401);
    } else {
      await db
        .collection("messages")
        .deleteOne({ _id: ObjectId(req.params.id) });
      return res.sendStatus(204);
    }
  } catch (err) {
    console.log(err);
  }
});

app.put("/messages/:id", async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  const user = req.headers.user;

  try {
    const participanteExistente = await db
      .collection("messages")
      .findOne({ name: user });
    const mensagemExiste = await db
      .collection("messages")
      .find({ _id: ObjectId(id) })
      .toArray();

    if (!participanteExistente || mensagemExiste.length === 0) {
      res.sendStatus(404);
      return;
    }

    if (mensagemExiste[0].from !== user) {
      return res.sendStatus(401);
    }

    await schemaPut.validateAsync(body, { abortEarly: false });

    db.collection("messages").updateOne(
      { _id: ObjectId(id) },
      { $set: req.body }
    );
    return res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }
});

app.listen(5000, () => console.log("Server running on port: 5000"));
