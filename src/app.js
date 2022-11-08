import express from "express";
import cors from "cors";

const app = express()

app.get("/live", (req, res) => {
    res.send("Tudo funcionando perfeitamente")
});

app.listen(5000, (req, res) => console.log("Server running on port: 5000"));