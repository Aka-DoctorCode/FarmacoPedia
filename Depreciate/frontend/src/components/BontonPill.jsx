import { useContext } from 'react';
import { counterContext } from '../context/counterContext';

import Styles from '../components/BotonPill.module.css';

const BontonPill = () => {
	const { menuMostrar } = useContext(counterContext);
	return (
		<>
			<button
				onClick={() => {
					menuMostrar();
				}}
				id={Styles.menuCapsulaOff}
				// No se donde esta la clase
				// className={Styles.botonAfter}
			>
				<div id={Styles.capsulaOscuro} />
				<div id={Styles.capsulaClaro} />
			</button>
		</>
	);
};

export default BontonPill;
