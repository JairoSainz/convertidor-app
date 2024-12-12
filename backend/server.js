const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const cookies = process.env.YOUTUBE_COOKIES;
const userAgent = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
const visitorData = process.env.YT_VISITOR_DATA;

app.post("/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL no proporcionada" });
  }

  try {
    const downloadDir = path.join(__dirname, "downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const outputPath = path.join(downloadDir, "%(title)s.%(ext)s");
    const cookiePath = path.join(__dirname, "cookies.txt");
    fs.writeFileSync(cookiePath, cookies);

    const command = `yt-dlp --extractor-args "youtube:visitor_data=${visitorData}" --cookies "${cookiePath}" --output "${outputPath}" --user-agent "${userAgent}" --print filename "${url}"`;

    exec(command, (error, stdout, stderr) => {
      fs.unlinkSync(cookiePath); // Eliminar el archivo de cookies

      if (error) {
        console.error(`Error al ejecutar yt-dlp: ${error.message}`);
        return res.status(500).json({ error: `Error al ejecutar yt-dlp: ${error.message}` });
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }

      const filename = stdout.trim();
      const downloadedFilePath = path.join(downloadDir, filename);

      if (fs.existsSync(downloadedFilePath)) {
        res.download(downloadedFilePath, (err) => {
          if (err) {
            console.error("Error al enviar archivo:", err);
            res.status(500).json({ error: "Error al enviar archivo" });
          } else {
            fs.unlinkSync(downloadedFilePath); // Eliminar archivo después de descargarlo
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
