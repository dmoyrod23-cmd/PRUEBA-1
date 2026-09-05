class HomeController {
  static index(req, res) {
    res.render("home", { titulo: "Inicio" });
  }

  static acerca(req, res) {
    res.render("about", { titulo: "Acerca de" });
  }
}

module.exports = HomeController;
