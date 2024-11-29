const express = require("express");
const youtubedl = require("youtube-dl-exec");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Crear carpeta 'output' si no existe
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Endpoint para descargar y convertir a MP3
app.post("/download", async (req, res) => {
  const videoUrl = req.body.url;

  if (!videoUrl || !videoUrl.startsWith("https://www.youtube.com")) {
    return res.status(400).json({ error: "URL no válida o no soportada." });
  }

  const outputFilePath = path.join(outputDir, `${Date.now()}.mp3`);

  try {
    // Ejecutar descarga y conversión
    await youtubedl(videoUrl, {
      extractAudio: true,
      audioFormat: "mp3",
      output: outputFilePath,
      noPlaylist: true,
    });

    // Establecer encabezados para forzar la descarga
    res.download(outputFilePath, path.basename(outputFilePath), (err) => {
      if (err) {
        console.error("Error al enviar el archivo:", err);
        res.status(500).json({ error: "Error al procesar el archivo." });
      } else {
        // Eliminar el archivo una vez enviado
        fs.unlinkSync(outputFilePath);
      }
    });
  } catch (err) {
    console.error("Error en yt-dlp:", err.stderr || err.message);
    res.status(500).json({ error: "Error al procesar el video." });
  }
});

// Limpiar archivos antiguos (opcional)
const clearOldFiles = () => {
  const files = fs.readdirSync(outputDir);
  files.forEach((file) => {
    const filePath = path.join(outputDir, file);
    const stats = fs.statSync(filePath);
    const now = Date.now();
    const ageInHours = (now - stats.mtimeMs) / (1000 * 60 * 60);

    if (ageInHours > 24) {
      fs.unlinkSync(filePath);
    }
  });
};
setInterval(clearOldFiles, 1000 * 60 * 60);

// Iniciar el servidor
app.listen(3000, () => {
  console.log("Servidor ejecutándose en http://localhost:3000/");
});
