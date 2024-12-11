const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Habilitar CORS
app.use(express.json()); // Para procesar JSON

// Obtener las cookies de la variable de entorno y el User-Agent
const cookies = process.env.YOUTUBE_COOKIES; // Las cookies exportadas desde tu navegador
const userAgent = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'; // User-Agent, si es necesario
const visitorData = process.env.YT_VISITOR_DATA; // La variable de entorno para visitor_data

app.post("/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL no proporcionada" });
  }

  try {
    // Crear el directorio de descargas si no existe
    const downloadDir = path.join(__dirname, "downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Definir la ruta de salida para el archivo descargado
    const outputPath = path.join(downloadDir, "%(title)s.%(ext)s");

    // Comando para descargar el video
    const command = `yt-dlp --extractor-args "youtube:visitor_data=${visitorData}" --cookies "${cookies}" --output "${outputPath}" --user-agent "${userAgent}" "${url}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar yt-dlp: ${error.message}`);
        return res.status(500).json({ error: `Error al ejecutar yt-dlp: ${error.message}` });
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return res.status(500).json({ error: `stderr: ${stderr}` });
      }

      // Aquí usamos el nombre del archivo descargado
      const filename = stdout.trim();
      const downloadedFilePath = path.join(downloadDir, filename);

      // Verificar si el archivo descargado existe
      if (fs.existsSync(downloadedFilePath)) {
        res.download(downloadedFilePath, (err) => {
          if (err) {
            console.error("Error al enviar archivo:", err);
            res.status(500).json({ error: "Error al enviar archivo" });
          } else {
            // Eliminar el archivo después de enviarlo
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
