import { Box, LinearProgress } from '@elementor/ui';

const Loader = ( props ) => (
	<Box sx={ { px: 4, py: 6 } }>
		<LinearProgress color="secondary" { ...props } />
	</Box>
);

export default Loader;
