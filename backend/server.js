const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

// Habilitar CORS y JSON
app.use(cors());
app.use(express.json());

// Obtener las cookies desde la variable de entorno
const cookies = process.env.YOUTUBE_COOKIES;
const cookiesPath = path.join(__dirname, "cookies.txt");
fs.writeFileSync(cookiesPath, cookies, "utf8");

// Crear directorio downloads si no existe
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
    const outputPath = path.join(downloadsDir, "%(title)s.%(ext)s");
    const command = `yt-dlp --cookies "${cookiesPath}" --output "${outputPath}" --extractor-args "youtube:player_client=web" "${url}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar yt-dlp: ${error.message}`);
        return res.status(500).json({
          error: "Error al ejecutar yt-dlp",
          details: stderr || error.message,
        });
      }

      console.log(`stdout: ${stdout}`);
      res.status(200).json({ message: "Descarga en proceso", details: stdout });
    });
  } catch (err) {
    console.error("Error del servidor:", err);
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
