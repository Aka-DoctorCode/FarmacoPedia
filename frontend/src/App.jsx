import { useState } from 'react';
// import Styles from './styles/App.css';

import Descargo from './views/Descargo';
import Frame from './views/Frame';
import Menu from './components/Menu';
import BotonPill from './components/BontonPill';

import ContenidoFarmacos from './views/ContenidoFarmacos';
import ContenidoFamilia from './views/ContenidoFamilia';
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
			<BotonPill />
			{descargoVisible && <Descargo ocultar={hideDescargo} />}
			<Frame
				cargar={cargar}
				showMenu={() => <Menu cargar={cargar} />}
				showContenidoFarmacos={() => <ContenidoFarmacos cargar={cargar} />}
				showContenidoFamilia={() => <ContenidoFamilia cargar={cargar} />}
				showSearchOn={() => <SearchOn cargar={cargar} />}
				showSearchOff={() => <SearchOff cargar={cargar} />}
			></Frame>
			<Footer />
		</StateContext>
	);
};

export default App;
