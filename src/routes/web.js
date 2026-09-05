const { Router } = require("express");

const HomeController = require("../controllers/HomeController");
const UserController = require("../controllers/UserController");

const router = Router();

router.get("/", HomeController.index);
router.get("/acerca", HomeController.acerca);

router.get("/usuarios", UserController.index);
router.get("/usuarios/nuevo", UserController.nuevoFormulario);
router.post("/usuarios", UserController.store);
router.get("/usuarios/:id", UserController.show);

module.exports = router;
