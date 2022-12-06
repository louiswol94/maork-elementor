import FilesUploadHandler from '../utils/files-upload-handler';

var ControlMultipleBaseItemView = require( 'elementor-controls/base-multiple' ),
	ControlMediaItemView;

ControlMediaItemView = ControlMultipleBaseItemView.extend( {
	ui() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.controlMedia = '.elementor-control-media';
		ui.mediaImage = '.elementor-control-media__preview';
		ui.mediaVideo = '.elementor-control-media-video';
		ui.frameOpeners = '.elementor-control-preview-area';
		ui.removeButton = '.elementor-control-media__remove';
		ui.fileName = '.elementor-control-media__file__content__info__name';
		ui.mediaImageSize = '.elementor-control-media-display-size';
		ui.mediaSizeWrapper = '.elementor-control-media-size';

		return ui;
	},

	events() {
		return _.extend( ControlMultipleBaseItemView.prototype.events.apply( this, arguments ), {
			'click @ui.frameOpeners': 'openFrame',
			'click @ui.removeButton': 'deleteImage',
			'change @ui.mediaImageSize': 'onMediaImageSizeChange',
		} );
	},

	getMediaType() {
		// `get( 'media_type' )` is for BC.
		return this.mediaType || this.model.get( 'media_type' ) || this.model.get( 'media_types' )[ 0 ];
	},

	/**
	 * Get library type for `wp.media` using a given media type.
	 *
	 * @param {string} mediaType - The media type to get the library for.
	 * @return {string} library media type
	 */
	getLibraryType( mediaType ) {
		if ( ! mediaType ) {
			mediaType = this.getMediaType();
		}

		return ( 'svg' === mediaType ) ? 'image/svg+xml' : mediaType;
	},

	// Save last selected control for breakpoints to be able to open the same control on breakpoint change, with defaults values.
	setPrevState( options ) {
		if ( ! options.id ) {
			return;
		}
		this.setEditSetting( 'mediaId', options.id );
		this.setEditSetting( 'mediaAlt', options.alt );
		this.setEditSetting( 'mediaSize', options.size );
	},

	resetPrevState() {
		this.setEditSetting( 'mediaId', null );
		this.setEditSetting( 'mediaAlt', null );
		this.setEditSetting( 'mediaSize', null );
	},

	applySavedValue() {
		const value = this.getControlValue( 'url' ),
			url = value || this.getControlPlaceholder()?.url,
			mediaType = this.getMediaType();

		if ( [ 'image', 'svg' ].includes( mediaType ) ) {
			this.ui.mediaImage.css( 'background-image', url ? 'url(' + url + ')' : '' );

			if ( value ) {
				this.setEditSetting( 'preview_image', true );
			}

			if ( ! value && url ) {
				this.ui.mediaImage.css( 'opacity', 0.5 );
				this.setEditSetting( 'preview_image_opacity', true );
			}

			this.setPrevState( {
				id: this.getControlValue( 'id' ),
				alt: this.getControlValue( 'alt' ),
				size: this.getControlValue( 'size' ),
			} );
		} else if ( 'video' === mediaType ) {
			this.ui.mediaVideo.attr( 'src', url );
		} else {
			const fileName = url ? url.split( '/' ).pop() : '';
			this.ui.fileName.text( fileName );
		}

		this.ui.controlMedia.toggleClass( 'elementor-media-empty', ! value );
		this.toggleSizeControl();
	},

	openFrame( e ) {
		const mediaType = e?.target?.dataset?.mediaType || this.getMediaType();
		this.mediaType = mediaType;

		if ( ! mediaType ) {
			return;
		}

		if ( ! FilesUploadHandler.isUploadEnabled( mediaType ) ) {
			FilesUploadHandler.getUnfilteredFilesNotEnabledDialog( () => this.openFrame( e ) ).show();

			return false;
		}

		// If there is no frame, or the current initialized frame contains a different library than
		// the `data-media-type` of the clicked button, (re)initialize the frame.
		if ( ! this.frame || this.getLibraryType( mediaType ) !== this.currentLibraryType ) {
			this.initFrame();
		}

		this.frame.open();

		// Set params to trigger sanitizer
		FilesUploadHandler.setUploadTypeCaller( this.frame );

		const selectedId = this.getControlValue( 'id' );

		if ( ! selectedId ) {
			return;
		}

		this.frame.state().get( 'selection' ).add( wp.media.attachment( selectedId ) );
	},

	deleteImage( event ) {
		event.stopPropagation();

		this.setValue( {
			url: '',
			id: '',
		} );

		this.applySavedValue();
	},

	/**
	 * Create a media modal select frame, and store it so the instance can be reused when needed.
	 */
	initFrame() {
		const mediaType = this.getMediaType();
		this.currentLibraryType = this.getLibraryType( mediaType );

		// Set current doc id to attach uploaded images.
		wp.media.view.settings.post.id = elementor.config.document.id;
		this.frame = wp.media( {
			frame: 'post',
			type: 'image',
			multiple: false,
			states: [
				new wp.media.controller.Library( {
					title: __( 'Insert Media', 'elementor' ),
					library: wp.media.query( { type: this.currentLibraryType } ),
					multiple: false,
					date: false,
				} ),
			],
		} );

		// Remove unwanted elements when frame is opened.
		this.frame.on( 'ready open', this.onFrameReady.bind( this ) );

		// When a file is selected, run a callback.
		this.frame.on( 'insert select', this.select.bind( this ) );

		if ( elementorCommon.config.filesUpload.unfilteredFiles ) {
			this.setUploadMimeType( this.frame, mediaType );
		}
	},

	/**
	 * Hack to remove unwanted elements from modal & Open the `Insert from URL` tab.
	 */
	onFrameReady() {
		const $frame = this.frame.$el;

		const elementsToRemove = [
			'#menu-item-insert',
			'#menu-item-gallery',
			'#menu-item-playlist',
			'#menu-item-video-playlist',
			'.embed-link-settings',
		];

		$frame.find( elementsToRemove.join( ',' ) ).remove();

		// Change the default button text using CSS by passing the text as a variable.
		$frame.css( '--button-text', `'${ __( 'Insert Media', 'elementor' ) }'` );

		// Remove elements from the URL upload tab.
		$frame.addClass( 'e-wp-media-elements-removed' );

		if ( 'url' === this.getControlValue( 'source' ) ) {
			// Go to the url tab.
			$frame.find( '#menu-item-embed' ).trigger( 'click' );

			// Hide the top media tabs ( WordPress does that automatically if a real user clicks the url tab ).
			$frame.addClass( 'hide-router' );

			// Load the image URL.
			this.frame.views.get( '.media-frame-content' )[ 0 ].url.model.set( {
				url: this.getControlValue( 'url' ),
				alt: this.getControlValue( 'alt' ),
			} );
		} else {
			// Go to the upload tab.
			$frame.find( '#menu-item-library' ).trigger( 'click' );
		}
	},

	setUploadMimeType( frame, ext ) {
		// Add unfiltered files to the allowed upload extensions
		const oldExtensions = _wpPluploadSettings.defaults.filters.mime_types[ 0 ].extensions;

		frame.on( 'ready', () => {
			_wpPluploadSettings.defaults.filters.mime_types[ 0 ].extensions = ( 'application/json' === ext ) ? 'json' : oldExtensions + ',svg';
		} );

		this.frame.on( 'close', () => {
			// Restore allowed upload extensions
			_wpPluploadSettings.defaults.filters.mime_types[ 0 ].extensions = oldExtensions;
		} );
	},

	/**
	 * Callback handler for when an attachment is selected in the media modal.
	 * Gets the selected image information, and sets it within the control.
	 */
	select() {
		this.trigger( 'before:select' );

		const state = this.frame.state();
		this.resetPrevState();

		let attachment;

		if ( 'embed' === state.get( 'id' ) ) {
			// Insert from URL.
			attachment = {
				url: state.props.get( 'url' ),
				id: '',
				alt: state.props.get( 'alt' ),
				source: 'url',
			};
		} else {
			// Get the attachment from the modal frame.
			attachment = this.frame.state().get( 'selection' ).first().toJSON();
			attachment.source = 'library';
		}

		if ( attachment.url ) {
			const updatedState = {
				url: attachment.url,
				id: attachment.id,
				alt: attachment.alt,
				source: attachment.source,
			};
			this.setValue( updatedState );

			if ( this.model.get( 'responsive' ) ) {
				// Render is already calls `applySavedValue`, therefore there's no need for it in this case.
				this.renderWithChildren();
			} else {
				this.applySavedValue();
			}

			this.setPrevState( updatedState );
			this.toggleSizeControl();
		}
		this.trigger( 'after:select' );
	},

	onBeforeDestroy() {
		this.$el.remove();
	},

	onMediaImageSizeChange() {
		this.ui.mediaImageSize.removeClass( 'e-select-placeholder' );
		const selectedImage = {
			id: this.getCurrentValue()?.id ?? this.getEditSettings( 'mediaId' ),
			alt: this.getCurrentValue()?.alt ?? this.getEditSettings( 'mediaAlt' ),
		};

		const selectedSize = this.ui.mediaImageSize.val();
		let imageURL = elementor.imagesManager.getImageUrl( {
			id: selectedImage.id,
			size: selectedSize,
		} );

		const stateOptions = {
			url: null,
			id: selectedImage.id,
			alt: selectedImage.alt,
			dimensions: selectedSize,
			source: 'library',
		};

		if ( imageURL ) {
			stateOptions.url = imageURL;
			this.setValue( stateOptions );
		} else {
			elementor.channels.editor.once( 'imagesManager:detailsReceived', ( data ) => {
				imageURL = data[ selectedImage.id ][ selectedSize ];
				if ( imageURL ) {
					stateOptions.url = imageURL;
					this.setValue( stateOptions );
				}
			} );
		}
	},

	toggleSizeControl() {
		const sizesSupport = this.model.get( 'sizes_supported' );
		const hasImage = this.getEditSettings( 'preview_image' );
		const opacity = this.getEditSettings( 'preview_image_opacity' );

		if ( ! sizesSupport && ! hasImage ) {
			this.ui.mediaSizeWrapper.hide();
		}
		if ( opacity ) {
			this.ui.mediaImageSize.addClass( 'e-select-placeholder' );
		}
	},
} );

module.exports = ControlMediaItemView;
