import { createContext, useState } from 'react';

export const counterContext = createContext();

const StateContext = ({ children }) => {
    // ---------------------------------------------------------
    // Estados Existentes (Mantenidos)
    // ---------------------------------------------------------
    const [descargoVisible, setDescargoVisible] = useState(() => {
        return !document.cookie
            .split(';')
            .some((item) => item.trim() === 'farmacopedia_disclaimer_accepted=true');
    });
    const [menu, setMenu] = useState(false);
    const [busqueda, setBusqueda] = useState(false); // Corregido typo 'busquda'
    const [listaFarmacos, setListaFarmacos] = useState(true);
    const [listaFamilia, setListaFamilia] = useState(false);

    // ---------------------------------------------------------
    // 🆕 Nuevos Estados (Para que tus componentes no den error)
    // ---------------------------------------------------------
    const [familiaSeleccionada, setFamiliaSeleccionada] = useState(null);
    const [farmacoSeleccionado, setFarmacoSeleccionado] = useState(null);

    // ---------------------------------------------------------
    // Funciones de Control
    // ---------------------------------------------------------
    const descargoOcultar = () => {
        setDescargoVisible(false);
        document.cookie = 'farmacopedia_disclaimer_accepted=true; path=/; max-age=3600';
    };
    
    const menuMostrar = () => setMenu(true);
    const menuOcultar = () => setMenu(false);
    
    const busquedaMostrar = () => setBusqueda(true);
    const busquedaOcultar = () => setBusqueda(false);
    
    const listaFarmacosMostrar = () => setListaFarmacos(true);
    const listaFarmacosOcultar = () => setListaFarmacos(false);
    
    const listaFamiliaMostrar = () => setListaFamilia(true);
    const listaFamiliaOcultar = () => setListaFamilia(false);

    return (
        <counterContext.Provider
            value={{
                descargoVisible,
                descargoOcultar,
                menu,
                menuMostrar,
                menuOcultar,
                busqueda, // Cambiado de busquda -> busqueda
                busquedaMostrar,
                busquedaOcultar,
                listaFarmacos,
                listaFarmacosMostrar,
                listaFarmacosOcultar,
                listaFamilia,
                listaFamiliaMostrar,
                listaFamiliaOcultar,
                // 🆕 Exportamos los nuevos estados y sus funciones
                familiaSeleccionada,
                setFamiliaSeleccionada,
                farmacoSeleccionado,
                setFarmacoSeleccionado
            }}
        >
            {children}
        </counterContext.Provider>
    );
};

export default StateContext;