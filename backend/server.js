const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta temporal para guardar las cookies
const cookiesPath = "/tmp/yt-cookies.txt";

// Escribe las cookies desde las variables de entorno
if (!process.env.YOUTUBE_COOKIES) {
  console.error("Error: La variable de entorno YOUTUBE_COOKIES no está configurada.");
  process.exit(1);
}
fs.writeFileSync(cookiesPath, process.env.YOUTUBE_COOKIES, "utf8");
console.log("Archivo de cookies escrito correctamente.");

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.post("/download", (req, res) => {
  const videoUrl = req.body.url;

  if (!videoUrl) {
    return res.status(400).json({ error: "Por favor, proporcione una URL válida." });
  }

  // Comando para descargar el video
  const command = `yt-dlp --cookies ${cookiesPath} -x --audio-format mp3 -o "/tmp/%(title)s.%(ext)s" ${videoUrl}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar yt-dlp: ${stderr}`);
      return res.status(500).json({ error: `Error al convertir el video: ${stderr}` });
    }

    console.log(`Comando ejecutado con éxito: ${stdout}`);

    // Busca el archivo generado
    const fileNameMatch = stdout.match(/Destination: (.+\.mp3)/);
    const filePath = fileNameMatch ? fileNameMatch[1] : null;

    if (filePath && fs.existsSync(filePath)) {
      res.download(filePath, (err) => {
        if (err) {
          console.error("Error al enviar el archivo:", err);
        }
        // Limpia el archivo después de enviarlo
        fs.unlinkSync(filePath);
      });
    } else {
      res.status(500).json({ error: "Error al encontrar el archivo generado." });
    }
  });
});

// Servidor en escucha
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
