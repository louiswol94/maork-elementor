import { useEffect, useState } from 'react';
import { Box } from '@elementor/ui';
import useImagePrompt from '../../hooks/use-image-prompt';
import useImageUpload from '../../hooks/use-image-upload';
import usePromptSettings from '../../hooks/use-prompt-settings';
import useImageScreenPanel from '../../hooks/use-image-screen-panel';
import { SCREENS, PANELS } from './consts/consts';
import { Screen } from './screens/screen';
import { PanelContent } from './panel-content/panel-content';
import Panel from '../../components/ui/panel';

const FormMedia = (
	{
		onClose,
		getControlValue,
		additionalOptions,
		controlView,
		credits,
	},
) => {
	const initialValue = getControlValue() === additionalOptions?.defaultValue ? { id: '', url: '' } : getControlValue();
	const [ editImage, setEditImage ] = useState( initialValue );
	const { screen, setScreen, panel, setPanel } = useImageScreenPanel(
		initialValue?.id !== '' ? SCREENS.VARIATIONS : SCREENS.GALLERY,
		'' === initialValue.id && '' === editImage.id ? PANELS.TEXT_TO_IMAGE : PANELS.IMAGE_TO_IMAGE,
	);
	const [ prompt, setPrompt ] = useState( '' );
	const { promptSettings, updatePromptSettings, resetPromptSettings } = usePromptSettings();
	const [ images, setImages ] = useState( [] );
	const [ insertToControl, setInsertToControl ] = useState( false );
	const { data, isLoading, error, send, sendUsageData } = useImagePrompt( {
		result: initialValue,
		credits,
		responseId: false,
	} );
	const { attachmentData, isUploading, uploadError, upload } = useImageUpload();

	const panelActive = ! isLoading && ! isUploading;
	const setAttachment = () => {
		sendUsageData();
		controlView.setSettingsModel( attachmentData.image );
		controlView.applySavedValue();
		onClose();
	};

	useEffect( () => {
		if ( ! isLoading && data?.result && Array.isArray( data?.result ) ) {
			setImages( data?.result );
			setScreen( SCREENS.GENERATE_RESULTS );
		}
	}, [ isLoading ] );

	useEffect( () => {
		if ( ! isUploading && attachmentData?.image?.id ) {
			if ( insertToControl ) {
				setAttachment( attachmentData.image );
			} else {
				setEditImage( attachmentData.image );
				setPanel( PANELS.IMAGE_TO_IMAGE );
			}
		}
	}, [ isUploading ] );

	const maybeUploadImage = ( imageToUpload, setAsAttachment = false ) => {
		if ( ! imageToUpload ) {
			return;
		}

		if ( setAsAttachment ) {
			setInsertToControl( true );
		}

		// Image already uploaded
		if ( editImage?.image?.seed && editImage?.image?.seed === imageToUpload?.seed ) {
			if ( setAsAttachment ) {
				// Remove inner image property used to avoid duplicate uploads
				const { image, ...attachment } = editImage;
				return setAttachment( attachment );
			}
			setPanel( PANELS.IMAGE_TO_IMAGE );
		}

		// Normalize object to match the upload function
		if ( imageToUpload?.imageUrl ) {
			imageToUpload = {
				...imageToUpload,
				image_url: imageToUpload.imageUrl,
				use_gallery_image: true,
			};
		}
		upload( { image: { ...imageToUpload }, prompt: prompt || imageToUpload.prompt } );
	};

	const submitPrompt = ( promptType, userPrompt ) => {
		if ( PANELS.TEXT_TO_IMAGE === promptType ) {
			return send( userPrompt, promptSettings );
		}
		return send( prompt, promptSettings, editImage );
	};

	const generateNewPrompt = () => {
		setPrompt( '' );
		setImages( [] );
		setEditImage( { id: '', url: '' } );
		resetPromptSettings();
		setScreen( SCREENS.GALLERY );
		setPanel( PANELS.TEXT_TO_IMAGE );
	};

	return (
		<Box display="flex" sx={ { overflowY: 'auto' } }>
			<Box position="relative">
				<Panel>
					<PanelContent { ...{
						error: error || uploadError,
						prompt,
						setPrompt,
						panelActive,
						generateNewPrompt,
						promptSettings,
						updatePromptSettings,
						submitPrompt,
						panel,
						editImage,
						images,
					} } />
				</Panel>
			</Box>

			<Screen { ...{
				isUploading,
				isLoading,
				screen,
				images,
				promptSettings,
				updatePromptSettings,
				generateNewPrompt,
				maybeUploadImage,
				setPrompt,
			} } />
		</Box>
	);
};

FormMedia.propTypes = {
	type: PropTypes.string.isRequired,
	controlType: PropTypes.string,
	getControlValue: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	additionalOptions: PropTypes.object,
	controlView: PropTypes.object,
	credits: PropTypes.number,
};

export default FormMedia;
