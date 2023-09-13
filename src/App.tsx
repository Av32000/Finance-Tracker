import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './views/Home';

const router = createBrowserRouter([
	{
		path: '/',
		element: <Home />,
	},
	{
		path: '/transactions',
		element: <Home />,
	},
	{
		path: '/stats',
		element: <Home />,
	},
	{
		path: '/monthly',
		element: <Home />,
	},
	{
		path: '/settings',
		element: <Home />,
	},
]);

function App() {
	return <RouterProvider router={router} />;
}

export default App;
