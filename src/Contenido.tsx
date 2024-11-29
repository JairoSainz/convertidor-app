import { useState } from "react";

function Contenido() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    if (!videoUrl) {
      setError("Por favor, inserte una URL válida.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: videoUrl }),
      });

      if (response.ok) {
        // Descarga automática del archivo
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${Date.now()}.mp3`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const data = await response.json();
        setError(data.error || "Error al convertir el video.");
      }
    } catch (error) {
      console.error("Error de conexión:", error); // Para depurar
      setError("Hubo un error al comunicarse con el servidor.");
    } finally {
      setIsLoading(false); // Asegurarse de que el loading se detenga
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
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button
          className="bg-orange-300 hover:bg-orange-500 hover:text-gray-50 py-2 px-4 inline-flex items-center"
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

export default Contenido;
