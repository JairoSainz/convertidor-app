function Footer(){
    return(
        <footer className="py-6">
        <div className="container mx-auto text-center">
            <h1 className="mb-4">© 2024 Sn.Music. Todos los derechos reservados.</h1>
            <div className="flex justify-center space-x-6">
                <a href="/acerca" className="hover:underline hover:text-orange-500">Acerca de Jairo</a>
                <a href="/contacto" className="hover:underline hover:text-orange-500">Contacto</a>
                <a href="/terminos" className="hover:underline hover:text-orange-500">Términos del Servicio</a>
                <a href="/politica-privacidad" className="hover:underline hover:text-orange-500">Política de Privacidad</a>
            </div>
        </div>
    </footer>
    )
}
export default Footer;