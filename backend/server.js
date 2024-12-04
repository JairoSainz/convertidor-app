const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
app.use(cors({ origin: "*" }));  // Esto permite solicitudes desde cualquier origen, incluyendo Netlify
app.use(express.json());

// Crear carpeta 'output' si no existe
const outputDir = path.resolve(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Endpoint para descargar y convertir a MP3
app.post("/download", async (req, res) => {
  const videoUrl = req.body.url;

  if (!videoUrl || !videoUrl.startsWith("https://www.youtube.com")) {
    return res.status(400).json({ error: "URL no válida o no soportada." });
  }

  const outputFilePath = path.join(outputDir, `${Date.now()}.mp3`);

  try {
    // Ejecutar yt-dlp con argumentos
    const command = `yt-dlp -x --audio-format mp3 --output "${outputFilePath}" "${videoUrl}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error al ejecutar yt-dlp:", stderr || error.message);
        return res.status(500).json({ error: "Error al procesar el video." });
      }

      // Enviar el archivo como respuesta para descarga
      res.download(outputFilePath, path.basename(outputFilePath), async (err) => {
        if (err) {
          console.error("Error al enviar el archivo:", err);
          res.status(500).json({ error: "Error al procesar el archivo." });
        } else {
          try {
            // Eliminar el archivo después de enviarlo
            await fs.promises.unlink(outputFilePath);
          } catch (unlinkErr) {
            console.error("Error al eliminar el archivo:", unlinkErr);
          }
        }
      });
    });
  } catch (err) {
    console.error("Error al procesar el video:", err.message);
    res.status(500).json({ error: "Error inesperado en el servidor." });
  }
});

// Limpiar archivos antiguos (opcional)
const clearOldFiles = async () => {
  try {
    const files = await fs.promises.readdir(outputDir);
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stats = await fs.promises.stat(filePath);
      const now = Date.now();
      const ageInHours = (now - stats.mtimeMs) / (1000 * 60 * 60);

      if (ageInHours > 24) {
        await fs.promises.unlink(filePath); // Eliminar archivo si es mayor a 24 horas
      }
    }
  } catch (err) {
    console.error("Error al limpiar archivos antiguos:", err);
  }
};
setInterval(clearOldFiles, 1000 * 60 * 60); // Ejecutar cada hora

// Iniciar el servidor
app.listen(3000, () => {
  console.log("Servidor ejecutándose en http://localhost:3000/");
});
