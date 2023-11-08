import { useState } from 'react';
import { counterContext } from './counterContext';

const StateContext = ({ children }) => {
	const [descargoVisible, setDescargoVisible] = useState(true);
	const [menu, setMenu] = useState(false);
	const [busquda, setBusqueda] = useState(false);
	const [listaFarmacos, setListaFarmacos] = useState(true);
	const [listaFamilia, setListaFamilia] = useState(false);

	const descargoOcultar = () => {
		setDescargoVisible(false);
	};
	const menuMostrar = () => {
		setMenu(true);
	};
	const menuOcultar = () => {
		setMenu(false);
	};
	const busquedaMostrar = () => {
		setBusqueda(true);
	};
	const busquedaOcultar = () => {
		setBusqueda(false);
	};
	const listaFarmacosMostrar = () => {
		setListaFarmacos(true);
	};
	const listaFarmacosOcultar = () => {
		setListaFarmacos(false);
	};
	const listaFamiliaMostrar = () => {
		setListaFamilia(true);
	};
	const listaFamiliaOcultar = () => {
		setListaFamilia(false);
	};
	return (
		<counterContext.Provider
			value={{
				descargoVisible,
				descargoOcultar,
				menu,
				menuMostrar,
				menuOcultar,
				busquda,
				busquedaMostrar,
				busquedaOcultar,
				listaFarmacos,
				listaFarmacosMostrar,
				listaFarmacosOcultar,
				listaFamilia,
				listaFamiliaMostrar,
				listaFamiliaOcultar,
			}}
		>
			{children}
		</counterContext.Provider>
	);
};

export default StateContext;
