import { useState } from 'react';
import './styles/App.css';

import Descargo from './views/Descargo';
import Frame from './views/Frame';
import Menu from './components/Menu';

import Contenido from './views/Contenido';
import SearchOn from './components/SearchOn';
import SearchOff from './components/SearchOff';
import Footer from './components/Footer';

import StateContext from './context/StateContext';
const App = () => {
	const [descargoVisible, setDescargoVisible] = useState(true);
	// Función para ocultar el componente Descargo
	const hideDescargo = () => {
		setDescargoVisible(false);
	};
	const cargar = true;

	return (
		<StateContext>
			{descargoVisible && <Descargo ocultar={hideDescargo} />}
			<Frame
				cargar={cargar}
				showMenu={() => <Menu cargar={cargar} />}
				showContenido={() => <Contenido cargar={cargar} />}
				showSearchOn={() => <SearchOn cargar={cargar} />}
				showSearchOff={() => <SearchOff cargar={cargar} />}
			></Frame>
			<Footer />
		</StateContext>
	);
};

export default App;
