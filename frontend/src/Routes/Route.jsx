import Frame from '../views/Frame';
import StateContext from '../context/StateContext';

import Post from '../components/Post';
import BotonPill from '../components/BontonPill';
import Footer from '../components/Footer';
const PostRoute = () => {
	return (
		<StateContext>
			<BotonPill />
			<Post />
			<Frame />
			<Footer />
		</StateContext>
	);
};

export default PostRoute;
