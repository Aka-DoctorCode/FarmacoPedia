import { useState } from 'react';
import axios from 'axios';

import Styles from './Post.module.css';

const Post = () => {
	const [nombre, setNombre] = useState('');
	const [familia, setFamilia] = useState('');
	const [mecanismoDeAccion, setMecanismoDeAccion] = useState('');
	const [indicaciones, setIndicaciones] = useState('');
	const [presentaciones, setPresentaciones] = useState('');
	// const [nombresComercial, setNombresComercial] = useState('');
	const [posologia, setPosologia] = useState('');
	const [riesgo, setRiesgo] = useState('');
	const [contraindicaciones, setContraindicaciones] = useState('');
	const [interacciones, setInteracciones] = useState('');
	const [reaccionesAdversas, setReaccionesAdversas] = useState('');
	const [sobreDosis, setSobreDosis] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();
		const farmaco = {
			nombre,
			familia,
			mecanismoDeAccion,
			indicaciones,
			presentaciones,
			// nombresComercial,
			posologia,
			riesgo,
			contraindicaciones,
			interacciones,
			reaccionesAdversas,
			sobreDosis,
		};
		try {
			const response = await axios.post(`${import.meta.env.VITE_API_URL}/agregarFarmaco`, farmaco);
			console.log(response.data);
			alert('Farmaco agregado con éxito');
		} catch (error) {
			console.error(error);
			alert('Error al agregar farmaco');
		}
	};

	const [showAsteriscoBox, setShowAsteriscoBox] = useState(false);

	return (
		<section id={Styles.contenedor}>
			<h1 id={Styles.titulo}>Agregar nuevo farmaco</h1>
			<form onSubmit={handleSubmit}>
				<label>
					Nombre:
					<input
						type='text'
						value={nombre}
						onChange={(e) => setNombre(e.target.value)}
					/>
				</label>
				<label>
					<div className={Styles.labelConAsterisco}>
						<span>Familia:</span>
						<div
							className={Styles.asterisco}
							onMouseOver={() => setShowAsteriscoBox(true)}
							onMouseOut={() => setShowAsteriscoBox(false)}
						>
							&nbsp;!&nbsp;
						</div>
						{showAsteriscoBox && (
							<div
								className={Styles.asteriscoBox}
								onMouseOver={() => setShowAsteriscoBox(true)}
								onMouseOut={() => setShowAsteriscoBox(false)}
							>
								&nbsp;&nbsp;&nbsp;&nbsp;Separe cada familia con una
								coma&nbsp;&nbsp;
							</div>
						)}
					</div>
					<input
						type='text'
						value={familia}
						onChange={(e) => setFamilia(e.target.value)}
					/>
				</label>
				<label>
					Mecanismo de Acción:
					<textarea
						type='text'
						value={mecanismoDeAccion}
						onChange={(e) => setMecanismoDeAccion(e.target.value)}
					/>
				</label>
				<label>
					Indicaciones:
					<textarea
						type='text'
						value={indicaciones}
						onChange={(e) => setIndicaciones(e.target.value)}
					/>
				</label>
				<label>
					Presentaciones:
					<textarea
						type='text'
						value={presentaciones}
						onChange={(e) => setPresentaciones(e.target.value)}
					/>
				</label>
				{/* <label>
					Nombres Comercial:
					<textarea
						type='text'
						value={nombresComercial}
						onChange={(e) => setNombresComercial(e.target.value)}
					/>
				</label> */}
				<label>
					Posología:
					<textarea
						type='text'
						value={posologia}
						onChange={(e) => setPosologia(e.target.value)}
					/>
				</label>

				<label>
					Riesgo:
					<textarea
						type='text'
						value={riesgo}
						onChange={(e) => setRiesgo(e.target.value)}
					/>
				</label>
				<label>
					Contraindicaciones:
					<textarea
						type='text'
						value={contraindicaciones}
						onChange={(e) => setContraindicaciones(e.target.value)}
					/>
				</label>
				<label>
					Interacciones:
					<textarea
						type='text'
						value={interacciones}
						onChange={(e) => setInteracciones(e.target.value)}
					/>
				</label>
				<label>
					Reacciones Adversas:
					<textarea
						type='text'
						value={reaccionesAdversas}
						onChange={(e) => setReaccionesAdversas(e.target.value)}
					/>
				</label>
				<label>
					Sobre Dosis:
					<textarea
						type='text'
						value={sobreDosis}
						onChange={(e) => setSobreDosis(e.target.value)}
					/>
				</label>
				<button type='submit'>Agregar Farmaco</button>
			</form>
		</section>
	);
};

export default Post;
