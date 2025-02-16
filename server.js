const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const qr = require("qrcode");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());  // Permitir JSON en las solicitudes

// Configuración de Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");  // Reemplaza con tu archivo JSON
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "restaurante-cc8a5.firebasestorage.app"  // Reemplaza con tu ID de proyecto de Firebase
});

const bucket = admin.storage().bucket();

// Conectar a MySQL
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "root",
  database: "restaurantedb",
});

db.connect(err => {
  if (err) throw err;
  console.log("Conectado a la base de datos MySQL");
});

// Endpoint para actualizar un menú y generar/actualizar el QR en Firebase Storage
app.put('/menu/:id', async (req, res) => {
    const menuId = req.params.id;
    const { nombre, status } = req.body; // Datos que quieres actualizar

    // Generar URL para el QR (puedes modificarla según tu lógica)
    const qrData = `http://localhost:3000/menu/${menuId}`;

    try {
        // Generar el código QR como una imagen base64
        const qrImage = await qr.toDataURL(qrData);

        // Subir el código QR a Firebase Storage
        const buffer = Buffer.from(qrImage.split(',')[1], 'base64');
        const qrFileName = `menu_${menuId}.png`;
        const file = bucket.file(qrFileName);

        await file.save(buffer, {
          contentType: 'image/png',
          public: true,
        });

        const qrFileUrl = `https://storage.googleapis.com/${bucket.name}/${qrFileName}`;

        // Actualizar el menú en la base de datos con la URL del QR
        db.query(
            'UPDATE menu SET nombre = ?, status = ?, codigo_qr = ? WHERE id = ?',
            [nombre, status, qrFileUrl, menuId],
            (err, result) => {
                if (err) {
                    console.error('Error actualizando menú:', err);
                    return res.status(500).json({ error: 'Error al actualizar el menú' });
                }
                res.json({ message: 'Menú actualizado y QR generado', qr: qrFileUrl });
            }
        );

    } catch (error) {
        console.error('Error generando QR:', error);
        res.status(500).json({ error: 'Error generando el código QR' });
    }
});

// RUTA: Obtener todos los menús
app.get("/menus", (req, res) => {
  db.query("SELECT * FROM menu", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// RUTA: Obtener un menú por ID con sus platos
app.get("/menu/:id", (req, res) => {
  const menuId = req.params.id;
  const query = `
    SELECT m.*, p.id AS plato_id, p.nombre AS plato_nombre, p.descripcion, p.precio 
    FROM menu m
    LEFT JOIN plato p ON m.id = p.menu_id
    WHERE m.id = ?
  `;
  db.query(query, [menuId], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.status(404).json({ message: "Menú no encontrado" });

    const menu = {
      id: results[0].id,
      nombre: results[0].nombre,
      codigo_qr: results[0].codigo_qr,
      platos: results.map(row => ({
        id: row.plato_id,
        nombre: row.plato_nombre,
        descripcion: row.descripcion,
        precio: row.precio,
      })),
    };
    res.json(menu);
  });
});

// RUTA: Crear un nuevo menú y generar su QR en Firebase Storage
app.post("/menu", async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const query = "INSERT INTO menu (nombre) VALUES (?)";
  db.query(query, [nombre], async (err, result) => {
    if (err) throw err;

    const menuId = result.insertId;
    const qrData = `http://localhost:3000/menu/${menuId}`;

    try {
      // Generar el código QR como una imagen base64
      const qrImage = await qr.toDataURL(qrData);

      // Subir el código QR a Firebase Storage
      const buffer = Buffer.from(qrImage.split(',')[1], 'base64');
      const qrFileName = `menu_${menuId}.png`;
      const file = bucket.file(qrFileName);

      await file.save(buffer, {
        contentType: 'image/png',
        public: true,
      });

      const qrFileUrl = `https://storage.googleapis.com/${bucket.name}/${qrFileName}`;

      // Actualizar el menú con la URL del QR
      const updateQuery = "UPDATE menu SET codigo_qr = ? WHERE id = ?";
      db.query(updateQuery, [qrFileUrl, menuId], (err) => {
        if (err) throw err;
        res.json({ id: menuId, nombre, codigo_qr: qrFileUrl });
      });
    } catch (error) {
      console.error('Error generando o subiendo el QR:', error);
      res.status(500).json({ error: 'Error generando o subiendo el código QR' });
    }
  });
});

// RUTA: Eliminar un menú
app.delete("/menu/:id", (req, res) => {
  const menuId = req.params.id;
  const query = "DELETE FROM menu WHERE id = ?";
  db.query(query, [menuId], (err, result) => {
    if (err) throw err;
    if (result.affectedRows === 0) return res.status(404).json({ message: "Menú no encontrado" });

    res.json({ message: "Menú eliminado correctamente" });
  });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
