import Joi from "joi";

const schema = Joi.object({
  username: Joi.string().required(),
  lastStatus: Joi.number().required(),
});

try {
  const usuario = await schema.validateAsync({ username: "Felipe", lastStatus: 12 });
  console.log(usuario);
} catch (err) {
  console.log(err);
}
