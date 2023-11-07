import { useState } from 'react';
import { counterContext } from './counterContext';

const StateContext = ({ children }) => {
	const [descargoVisible, setDescargoVisible] = useState(true);
	const [menu, setMenu] = useState(false);
	const [busquda, setBusqueda] = useState(false);

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
			}}
		>
			{children}
		</counterContext.Provider>
	);
};

export default StateContext;
