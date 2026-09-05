const express = require("express");
const path = require("path");

const webRouter = require("./routes/web");

const app = express();
const PUERTO = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/", webRouter);

app.use((req, res) => {
  res.status(404).render("404", { titulo: "No encontrado" });
});

app.listen(PUERTO, () => {
  console.log(`Servidor MVC escuchando en http://localhost:${PUERTO}`);
});
