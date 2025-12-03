import { useState } from 'react';
import { counterContext } from './counterContext';

const StateContext = ({ children }) => {
	const [descargoVisible, setDescargoVisible] = useState(() => {
		return !document.cookie
			.split(';')
			.some((item) => item.trim() === 'farmacopedia_disclaimer_accepted=true');
	});
	const [menu, setMenu] = useState(false);
	const [busquda, setBusqueda] = useState(false);
	const [listaFarmacos, setListaFarmacos] = useState(true);
	const [listaFamilia, setListaFamilia] = useState(false);
	const [theme, setTheme] = useState('dark');

	const descargoOcultar = () => {
		setDescargoVisible(false);
		document.cookie =
			'farmacopedia_disclaimer_accepted=true; path=/; max-age=3600';
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
	const toggleTheme = () => {
		const newTheme = theme === 'dark' ? 'light' : 'dark';
		setTheme(newTheme);
		document.documentElement.setAttribute('data-theme', newTheme);
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
				theme,
				toggleTheme,
			}}
		>
			{children}
		</counterContext.Provider>
	);
};

export default StateContext;
