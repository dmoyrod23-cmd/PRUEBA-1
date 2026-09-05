let usuarios = [
  { id: 1, nombre: "Ana Torres", email: "ana@example.com" },
  { id: 2, nombre: "Luis Gomez", email: "luis@example.com" },
  { id: 3, nombre: "Marta Ruiz", email: "marta@example.com" }
];

class UserModel {
  static findAll() {
    return usuarios;
  }

  static findById(id) {
    return usuarios.find((u) => u.id === Number(id));
  }

  static create({ nombre, email }) {
    const nuevoId = usuarios.length ? Math.max(...usuarios.map((u) => u.id)) + 1 : 1;
    const usuario = { id: nuevoId, nombre, email };
    usuarios.push(usuario);
    return usuario;
  }
}

module.exports = UserModel;
