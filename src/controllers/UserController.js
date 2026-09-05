const UserModel = require("../models/UserModel");

class UserController {
  static index(req, res) {
    const usuarios = UserModel.findAll();
    res.render("users/index", { titulo: "Usuarios", usuarios });
  }

  static show(req, res) {
    const usuario = UserModel.findById(req.params.id);
    if (!usuario) {
      return res.status(404).render("404", { titulo: "No encontrado" });
    }
    res.render("users/show", { titulo: usuario.nombre, usuario });
  }

  static nuevoFormulario(req, res) {
    res.render("users/new", { titulo: "Nuevo usuario" });
  }

  static store(req, res) {
    const { nombre, email } = req.body;
    if (!nombre || !email) {
      return res.status(400).render("users/new", {
        titulo: "Nuevo usuario",
        error: "El nombre y el email son obligatorios."
      });
    }
    const usuario = UserModel.create({ nombre, email });
    res.redirect(`/usuarios/${usuario.id}`);
  }
}

module.exports = UserController;
