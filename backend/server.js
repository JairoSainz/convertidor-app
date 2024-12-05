const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta del archivo de cookies
const cookiesFilePath = path.join(__dirname, "cookies.txt");

if (!fs.existsSync(cookiesFilePath)) {
  console.error("Error: El archivo de cookies no existe. Exporta cookies desde el navegador.");
  process.exit(1);
}

// Asegurar que el directorio "downloads" exista
const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

app.post("/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL no proporcionada" });
  }

  try {
    // Ruta de salida
    const outputTemplate = path.join(downloadsDir, "%(title)s.%(ext)s");

    // Comando yt-dlp
    const command = `yt-dlp --cookies "${cookiesFilePath}" --output "${outputTemplate}" "${url}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar yt-dlp: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).json({
          error: "Error al ejecutar yt-dlp",
          details: stderr.trim(),
        });
      }

      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);

      // Buscar el archivo generado
      const regex = /(?<=\[download\] Destination: ).+/;
      const match = stdout.match(regex);

      if (match && match[0]) {
        const downloadedFilePath = match[0];

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
        res.status(404).json({ error: "Archivo no encontrado o descarga fallida." });
      }
    });
  } catch (error) {
    console.error("Error del servidor:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
