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

// Obtener las cookies de la variable de entorno
const cookies = process.env.YOUTUBE_COOKIES;

if (!cookies) {
  console.error("Error: No se ha configurado la variable de entorno YOUTUBE_COOKIES.");
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
    // Archivo temporal para guardar las cookies
    const cookiesFilePath = path.join(__dirname, "cookies.txt");
    fs.writeFileSync(cookiesFilePath, cookies);

    // Definir la ruta de salida
    const outputTemplate = path.join(downloadsDir, "%(title)s.%(ext)s");

    // Comando para ejecutar yt-dlp
    const command = `yt-dlp --cookies "${cookiesFilePath}" --output "${outputTemplate}" "${url}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar yt-dlp: ${error.message}`);
        return res.status(500).json({ error: "Error al ejecutar yt-dlp" });
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
