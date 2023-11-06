import { useState } from 'react';
import './styles/App.css';

import Descargo from './views/Descargo';
import Frame from './views/Frame';
const App = () => {
	const [descargoVisible, setDescargoVisible] = useState(true);
	// Función para ocultar el componente Descargo
	const hideDescargo = () => {
		setDescargoVisible(false);
	};

	return (
		<>
			{descargoVisible && <Descargo ocultar={hideDescargo} />}
			<Frame />
		</>
	);
};

export default App;
