import { useState } from 'react';
import Styles from './CapsulaOff.module.css';
const Frame = (props) => {
	const [animacion, setAnimacion] = useState('');
	return (
		<button
			onClick={() => {
				setTimeout(props.menu, 1000);
				setAnimacion(Styles.botonAfter);
			}}
			id={Styles.menuCapsulaOff}
			className={animacion}
		>
			<div id={Styles.capsulaOscuro} />
			<div id={Styles.capsulaClaro} />
		</button>
	);
};

export default Frame;
