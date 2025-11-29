import { useContext } from 'react';
import { counterContext } from '../context/counterContext';
import Styles from './Descargo.module.css';

export const Descargo = () => {
	const { descargoVisible, descargoOcultar } = useContext(counterContext);
	return (
		descargoVisible && (
			<section id={Styles.contenedor}>
				<main id={Styles.descargo}>
					<div id={Styles.contenedorTitulo}>
						<h1 id={Styles.titulo}>Descargo de responsabilidad</h1>
					</div>
					<div id={Styles.principal}>
						<div className={Styles.barra}></div>
						<p>
							El sitio web &#34;FarmacoPedia&#34; es un recurso de información
							sobre medicamentos y tratamientos médicos. El contenido de este
							sitio web está destinado a ser utilizado por profesionales de la
							salud. Ni el sitio web, ni su creador o colaboradores, se hacen
							responsables del mal uso que se le pueda dar a la información
							presente en el sitio web. Los usuarios de &#34;FarmacoPedia&#34;
							son responsables de verificar la información contenida en el sitio
							web con otras fuentes, antes de tomar cualquier decisión médica.
							Este descargo de responsabilidad se aplica a todo el contenido del
							sitio web, incluyendo, pero no limitado a, artículos, videos,
							imágenes, y otros materiales. Específicamente, el sitio web no se
							hace responsable de: Errores o inexactitudes en la información
							proporcionada. Daños o lesiones causadas por el uso de la
							información proporcionada. Cualquier acción tomada por un usuario
							del sitio web, basada en la información proporcionada. Los
							usuarios del sitio web son responsables de su propia salud y
							bienestar. Si tiene alguna pregunta o inquietud sobre su salud,
							debe consultar a un profesional de la salud.
						</p>
						<div className={Styles.barra}></div>
						<p>
							Al hacer click en el botón acepto. Estoy de acuerdo con las
							condiciones de uso de este sitio web y me hago responsable del uso
							que le de a la información.
						</p>
					</div>
					<button
						onClick={() => {
							descargoOcultar();
						}}
						id={Styles.boton}
					>
						Acepto
					</button>
				</main>
			</section>
		)
	);
};

export default Descargo;
