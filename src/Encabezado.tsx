import logo from "./assets/musica.png"

function Encabezado() {
  return (
    <div className="flex justify-center p-3">
      <div className="px-8 flex space-x-4">
      <img src={logo} alt="" className="w-10 h-10"/>
        <button className="text-right hover:bg-[#F9F6EE] hover:text-orange-600 text-black py-2 px-4 rounded">
          YouTube a Mp3
        </button>
        <button className="text-right hover:bg-[#F9F6EE] hover:text-orange-600 text-black py-2 px-4 rounded">
          YouTube a Mp4
        </button>
        <button className="text-right hover:bg-[#F9F6EE] hover:text-orange-600 text-black py-2 px-4 rounded">
          Idioma
        </button>
      </div>
    </div>
  );
}
export default Encabezado;
