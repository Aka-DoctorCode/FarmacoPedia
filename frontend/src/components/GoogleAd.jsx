import { useEffect, useRef } from 'react';
import Styles from './GoogleAd.module.css';

const GoogleAd = ({ 
    adClient = "ca-pub-5200148569892616", 
    adSlot = "",   
    adFormat = "auto", 
    fullWidthResponsive = "true" 
}) => {
    const initialized = useRef(false);

    useEffect(() => {
        // Evitamos peticiones si no hay slot o si ya se inicializó el componente
        if (!adSlot || initialized.current) return;

        try {
            // Empujamos el anuncio al array global de Google
            if (typeof window !== 'undefined' && window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                initialized.current = true;
            }
        } catch (error) {
            console.error("Error al inicializar AdSense:", error.message);
        }

        // Limpieza al desmontar el componente
        return () => {
            initialized.current = false;
        };
    }, [adSlot]);

    return (
        <div className={Styles.contenedorPublicidad}>
            {/* Etiqueta informativa de transparencia */}
            <span className={Styles.etiquetaPublicidad}>
                Publicidad
            </span>

            {/* Bloque de anuncio de Google */}
            <ins 
                className={`adsbygoogle ${Styles.anuncioIns}`}
                data-ad-client={adClient}
                data-ad-slot={adSlot}
                data-ad-format={adFormat}
                data-full-width-responsive={fullWidthResponsive}
            ></ins>
        </div>
    );
};

export default GoogleAd;