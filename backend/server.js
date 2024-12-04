const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Habilitar CORS
app.use(express.json()); // Para procesar JSON

// Obtener las cookies de la variable de entorno
const cookies = process.env.YOUTUBE_COOKIES;

app.post("/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL no proporcionada" });
  }

  try {
    // Definir la ruta de salida y las opciones de yt-dlp
    const outputPath = path.join(__dirname, "downloads", "%(title)s.%(ext)s");

    // Comando para ejecutar yt-dlp en el backend con las cookies
    const command = `yt-dlp --cookies "${cookies}" --output "${outputPath}" "${url}"`;

    // Ejecutar el comando en un proceso hijo
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar yt-dlp: ${error.message}`);
        return res.status(500).json({ error: "Error al ejecutar yt-dlp" });
      }
      if (stderr) {
        console.error(`Error en stderr: ${stderr}`);
        return res.status(500).json({ error: "Error en yt-dlp" });
      }

      console.log(`stdout: ${stdout}`);

      // Verificar si el archivo descargado existe
      const downloadedFilePath = path.join(__dirname, "downloads", `${stdout.trim()}.mp3`);

      if (fs.existsSync(downloadedFilePath)) {
        res.download(downloadedFilePath, (err) => {
          if (err) {
            console.error("Error al enviar archivo:", err);
            res.status(500).json({ error: "Error al enviar archivo" });
          } else {
            // Borrar el archivo después de enviarlo
            fs.unlinkSync(downloadedFilePath);
          }
        });
      } else {
        res.status(404).json({ error: "Archivo no encontrado" });
      }
    });
  } catch (error) {
    console.error("Error de servidor:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
