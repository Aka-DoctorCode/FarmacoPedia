import { useEffect } from 'react';

/**
 * Componente GoogleAd
 * * Permite renderizar bloques de anuncios de Google AdSense de forma dinámica.
 * Requiere el ID del cliente (adClient) y el ID del bloque (adSlot).
 */
const GoogleAd = ({ 
    adClient = "", // Tu ID de editor (pub-xxxxxxxxxxxxxxxx)
    adSlot = "",   // ID del bloque de anuncio
    adFormat = "auto", 
    fullWidthResponsive = "true",
    style = { display: 'block' } 
}) => {
    
    useEffect(() => {
        try {
            // Verificamos si la librería de Google Ads ya existe y ejecutamos el push
            if (window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (error) {
            // Registramos el error de forma silenciosa para no interrumpir la experiencia
            console.error("Error al cargar Google Ads:", error.message);
        }
    }, []);

    return (
        <div className="flex justify-center my-6 w-full overflow-hidden bg-gray-50 rounded-lg shadow-sm border border-gray-100">
            {/* Contenedor del anuncio */}
            <ins 
                className="adsbygoogle"
                style={style}
                data-ad-client={adClient}
                data-ad-slot={adSlot}
                data-ad-format={adFormat}
                data-full-width-responsive={fullWidthResponsive}
            ></ins>
            
            {/* Etiqueta informativa discreta para el usuario */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2 text-[10px] text-gray-400 uppercase tracking-widest">
                Publicidad
            </div>
        </div>
    );
};

export default GoogleAd;