import { Box, Typography } from '@elementor/ui';
import { IMAGE_ACTIONS } from '../consts/consts';
import useImageNavigation from '../../../hooks/use-image-navigation';
import ZoomImage from './components/zoom-image';
import ResultsGrid from './components/results-grid';

const FormGenerateResult = (
	{
		maybeUploadImage,
		images,
	},
) => {
	const { zoomedImageIndex, setZoomedImageIndex, imageNavigation } = useImageNavigation( images );

	const handleImageAction = ( imageAction, imageForAction ) => {
		switch ( imageAction ) {
			case IMAGE_ACTIONS.USE:
				maybeUploadImage( imageForAction, true );
				break;
			case IMAGE_ACTIONS.REFERENCE:
				maybeUploadImage( imageForAction );
				break;
			case IMAGE_ACTIONS.ZOOM:
				setZoomedImageIndex( imageForAction );
				break;
		}
	};

	return (
		<Box sx={ { overflowY: 'scroll', p: 10 } } flexGrow={ 1 }>
			{ zoomedImageIndex > -1
				? <ZoomImage { ...{
					images,
					zoomedImageIndex,
					handleImageAction,
					imageNavigation,
				} } />
				: <ResultsGrid { ...{
					images,
					handleImageAction,
				} } />
			}
		</Box>
	);
};

FormGenerateResult.propTypes = {
	maybeUploadImage: PropTypes.func.isRequired,
	images: PropTypes.array,
};

export default FormGenerateResult;
