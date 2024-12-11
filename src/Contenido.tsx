import { useState } from "react";

function Contenido() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidUrl, setIsValidUrl] = useState(true);

  // Función para validar la URL mientras el usuario escribe
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);

    // Validar que la URL es de YouTube
    const isValidYouTubeUrl =
      /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|v\/|e\/|watch\?v%3D|embed\/)([a-zA-Z0-9_-]{11})/.test(url);
    setIsValidUrl(isValidYouTubeUrl);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    if (!videoUrl) {
      setError("Por favor, inserte una URL válida.");
      setIsLoading(false);
      return;
    }

    // Validar que la URL es de YouTube
    if (!isValidUrl) {
      setError("Por favor, ingresa una URL válida de YouTube.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("https://convertidor-app.onrender.com/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: videoUrl }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${Date.now()}.mp3`; // Modifica dinámicamente el nombre si es necesario
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl); // Liberar la URL creada
      } else {
        const data = await response.json();
        setError(data?.error || "Error al convertir el video.");
      }
    } catch (error) {
      console.error("Error de conexión:", error); // Para depurar
      setError("Hubo un error al comunicarse con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-20">
      <h1 className="text-center mb-4 font-bold text-orange-500">Convertir YouTube a MP3</h1>
      <div className="flex flex-row border-2 border-gray-300 rounded-md overflow-hidden">
        <input
          type="text"
          placeholder="Por favor inserte una URL de video de YouTube"
          className="p-4 w-96 placeholder-gray-500 focus:outline-none focus:border-orange-500"
          value={videoUrl}
          onChange={handleUrlChange}
        />
        <button
          className="bg-orange-300 hover:bg-orange-500 hover:text-gray-50 py-2 px-4 inline-flex items-center"
          onClick={handleSearch}
          disabled={isLoading || !isValidUrl}
        >
          {isLoading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {!isValidUrl && <p className="text-red-500 mt-4">URL no válida de YouTube.</p>}
    </div>
  );
}

export default Contenido;
