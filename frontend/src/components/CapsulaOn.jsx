import { useState } from 'react';
import Styles from './CapsulaOn.module.css';
const CapsulaOn = (props) => {
	const x = [];
	for (let i = 1; i <= 40; i++) {
		x.push('n' + i);
	}

	const [animacion, setAnimacion] = useState('');
	return (
		<button
			onClick={() => {
				setTimeout(props.ocultar, 1000);
				setAnimacion(Styles.botonAfter);
			}}
			id={Styles.menuCapsulaOn}
			className={animacion}
		>
			<div id={Styles.bloquePartiuculas}>
				{x.map((element, index) => {
					return (
						<div
							key={index}
							className={Styles.particula}
							id={Styles[element]}
						/>
					);
				})}
			</div>
			<div id={Styles.capsulaOscuro} />
			<div id={Styles.capsulaClaro} />
		</button>
	);
};

export default CapsulaOn;
