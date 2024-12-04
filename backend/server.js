const express = require("express");
const { exec } = require("child_process");
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
    // Usar la URL directamente sin codificarla
    exec(`yt-dlp -x --audio-format mp3 --output "${outputFilePath}" "${videoUrl}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar yt-dlp: ${error.message}`);
        return res.status(500).json({
          error: "Error al procesar el video.",
          details: error.message,
        });
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return res.status(500).json({
          error: "Error en la conversión.",
          details: stderr,
        });
      }

      console.log(`stdout: ${stdout}`);

      // Establecer encabezados para forzar la descarga
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
    console.error("Error en yt-dlp:", err.stderr || err.message);
    res.status(500).json({ error: "Error al procesar el video.", details: err.message });
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
