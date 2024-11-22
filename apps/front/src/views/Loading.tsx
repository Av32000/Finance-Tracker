import Loader from '../components/Loader';

const Loading = () => {
	return (
		<div className="bg-bg h-screen overflow-hidden flex justify-center items-center flex-col">
			<img src="logo.svg" width={80} height={80} className=" m-10" />
			<Loader />
		</div>
	);
};

export default Loading;
