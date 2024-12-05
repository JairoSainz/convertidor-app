const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

// Habilitar CORS
app.use(cors());

// Procesar JSON
app.use(express.json());

// Obtener las cookies de la variable de entorno
const cookies = process.env.YOUTUBE_COOKIES;
const cookiesPath = path.join(__dirname, "cookies.txt");

// Escribir las cookies en un archivo temporal
fs.writeFileSync(cookiesPath, cookies, "utf8");

// Directorio para descargas
const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
  console.log(`Directorio creado: ${downloadsDir}`);
}

app.post("/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL no proporcionada" });
  }

  try {
    // Ruta de salida de descarga
    const outputPath = path.join(downloadsDir, "%(title)s.%(ext)s");

    // Comando yt-dlp
    const command = `yt-dlp --cookies "${cookiesPath}" --output "${outputPath}" "${url}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar yt-dlp: ${error.message}`);
        return res.status(500).json({ error: "Error al ejecutar yt-dlp" });
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }

      console.log(`stdout: ${stdout}`);

      // Buscar el archivo descargado en el stdout
      const downloadedFileMatch = stdout.match(/Destination: (.+)/);
      if (downloadedFileMatch) {
        const filePath = downloadedFileMatch[1].trim();

        // Enviar el archivo como respuesta
        res.download(filePath, (err) => {
          if (err) {
            console.error("Error al enviar archivo:", err);
            res.status(500).json({ error: "Error al enviar archivo" });
          } else {
            // Eliminar el archivo después de enviarlo
            fs.unlinkSync(filePath);
          }
        });
      } else {
        res.status(404).json({ error: "Archivo no encontrado" });
      }
    });
  } catch (err) {
    console.error("Error del servidor:", err);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
