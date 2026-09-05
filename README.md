# MVC Web Router

Aplicación web con arquitectura MVC (Modelo-Vista-Controlador) y un
enrutador central, construida con Node.js, Express y EJS.

## Estructura

```
src/
  app.js                 # Punto de entrada del servidor
  routes/web.js          # Enrutador: mapea URLs a controladores
  controllers/           # Controladores (HomeController, UserController)
  models/                # Modelos (UserModel)
  views/                 # Vistas EJS (layout + páginas)
public/
  css/style.css          # Estilos
```

## Cómo funciona el flujo MVC

1. Una petición HTTP llega al enrutador (`src/routes/web.js`).
2. El enrutador la despacha al método de un controlador según la URL y el verbo HTTP.
3. El controlador consulta el modelo si necesita datos.
4. El controlador renderiza una vista pasándole los datos.

## Rutas disponibles

| Método | Ruta              | Controlador             |
|--------|-------------------|--------------------------|
| GET    | `/`               | HomeController.index     |
| GET    | `/acerca`         | HomeController.acerca    |
| GET    | `/usuarios`       | UserController.index     |
| GET    | `/usuarios/nuevo` | UserController.nuevoFormulario |
| POST   | `/usuarios`       | UserController.store     |
| GET    | `/usuarios/:id`   | UserController.show      |

## Ejecutar

```bash
npm install
npm start
```

La app quedará disponible en `http://localhost:3000`.
