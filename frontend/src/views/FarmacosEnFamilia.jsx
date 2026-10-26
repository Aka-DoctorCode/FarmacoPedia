import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import { formatCategory } from '../utils/formatCategory.js';
import Styles from './FarmacosEnFamilia.module.css';

const FarmacosEnFamilia = () => {
    // 1. Añadimos las funciones necesarias del contexto
    const { 
        listaFamilia, 
        familiaSeleccionada, 
        setFarmacoSeleccionado, // Para guardar el fármaco elegido
        listaFarmacosMostrar,   // Para mostrar la vista de detalles
        listaFamiliaOcultar     // Para ocultar la lista actual
    } = useContext(counterContext);

    const [drugs, setDrugs] = useState([]);
    const [atcGroup, setAtcGroup] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchDrugs = async () => {
            if (!familiaSeleccionada) return;

            setIsLoading(true);
            try {
                // Petición al backend usando el nuevo endpoint enriquecido ATC
                const response = await drugService.getDrugsByAtc(familiaSeleccionada);
                
                if (response && response.success) {
                    setDrugs(response.data || []);
                    if (response.atcGroup) {
                        setAtcGroup(response.atcGroup);
                    }
                }
            } catch (error) {
                console.error('Error fetching drugs by ATC:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDrugs();
    }, [familiaSeleccionada]);

    const displayTitle = atcGroup?.name 
        ? `${atcGroup.name} ${atcGroup.code ? `(${atcGroup.code})` : ''}` 
        : formatCategory(familiaSeleccionada);

    return (
        listaFamilia && (
            <section id={Styles.contenedor}>
                <Helmet>
                    <title>Fármacos en: {displayTitle} | ClickSalud FarmacoPedia</title>
                    <meta name="description" content={`Fármacos en la clasificación ATC ${displayTitle}`} />
                </Helmet>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span id={Styles.tituloVista}>Fármacos en: {displayTitle}</span>
                    <span style={{ fontSize: '14px', color: '#666', marginLeft: '20px', fontFamily: 'Futura' }}>
                        {isLoading ? 'Cargando...' : `${drugs.length} fármacos registrados`}
                    </span>
                </div>
                <div id={Styles.lista}>
                    {drugs.map((drug, index) => (
                        <button 
                            key={index} 
                            className={Styles.pildora}
                            onClick={() => {
                                // 2. Lógica de navegación al hacer clic
                                setFarmacoSeleccionado(drug.name); // Guardamos el nombre
                                listaFamiliaOcultar();            // Cerramos esta lista
                                listaFarmacosMostrar();           // Abrimos el detalle (ContenidoFarmacos)
                            }}
                        >
                            {drug.name}
                        </button>
                    ))}
                </div>
            </section>
        )
    );
};

export default FarmacosEnFamilia;