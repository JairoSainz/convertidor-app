const express = require("express");
const ytDlp = require("yt-dlp");
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
    // Definir las opciones de yt-dlp
    const options = {
      url: url,
      cookies: cookies, // Pasar las cookies desde la variable de entorno
      extractAudio: true,
      audioQuality: 0,
      audioFormat: "mp3",
      output: path.join(__dirname, "downloads", "%(title)s.%(ext)s"), // Ajusta la ruta de salida
    };

    // Ejecutar yt-dlp para descargar el audio
    ytDlp(options, function (err, output) {
      if (err) {
        console.error("Error al ejecutar yt-dlp:", err);
        return res.status(500).json({ error: "Error al ejecutar yt-dlp" });
      }

      const outputPath = path.join(__dirname, "downloads", `${output.title}.mp3`);

      // Verificar si el archivo se descargó
      if (fs.existsSync(outputPath)) {
        res.download(outputPath, (err) => {
          if (err) {
            console.error("Error al enviar archivo:", err);
            res.status(500).json({ error: "Error al enviar archivo" });
          } else {
            // Borrar el archivo después de enviarlo para liberar espacio
            fs.unlinkSync(outputPath);
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
