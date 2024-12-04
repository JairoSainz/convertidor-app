const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
app.use(cors({ origin: "https://pruebaconvertidor.netlify.app" })); // Cambia por tu URL de Netlify
app.use(express.json());

const outputDir = path.resolve(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

app.post("/download", async (req, res) => {
  const videoUrl = req.body.url;
  if (!videoUrl || !videoUrl.startsWith("https://www.youtube.com")) {
    return res.status(400).json({ error: "URL no válida o no soportada." });
  }

  const cookiesPath = path.resolve(__dirname, "cookies.txt");
  const outputFilePath = path.join(outputDir, `${Date.now()}.mp3`);

  const command = `yt-dlp --cookies "${cookiesPath}" -x --audio-format mp3 --output "${outputFilePath}" "${videoUrl}"`;

  try {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error al ejecutar yt-dlp:", stderr || error.message);
        return res.status(500).json({ error: "Error al procesar el video." });
      }

      res.download(outputFilePath, path.basename(outputFilePath), async (err) => {
        if (err) {
          console.error("Error al enviar el archivo:", err);
          res.status(500).json({ error: "Error al enviar el archivo." });
        } else {
          try {
            await fs.promises.unlink(outputFilePath);
          } catch (unlinkErr) {
            console.error("Error al eliminar el archivo:", unlinkErr);
          }
        }
      });
    });
  } catch (err) {
    console.error("Error inesperado en el servidor:", err.message);
    res.status(500).json({ error: "Error inesperado en el servidor." });
  }
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor ejecutándose en http://localhost:3000/");
});
