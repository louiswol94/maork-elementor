export default class Heading extends elementorModules.frontend.handlers.Base {
	getDefaultSettings() {
		return {
			selectors: {
				title: '.elementor-heading-title',
			},
		};
	}

	getDefaultElements() {
		const selectors = this.getSettings( 'selectors' );

		return {
			$title: this.$element.find( selectors.title ),
		};
	}

	onElementChange( propertyName ) {
		if ( 'title' === propertyName ) {
			this.showFirstTitle();
		}
	}

	onInit() {
		super.onInit();

		if ( elementorFrontend.isEditMode() ) {
			this.showFirstTitle();
		}
	}

	showFirstTitle() {
		const title = this.getElementSettings( 'title' );

		if ( title.includes('#####') ) {
			setTimeout( () => {
				const valuesArray = title.split('#####');
				jQuery( '.elementor-element-'+this.getID()+' .elementor-heading-title' ).html( valuesArray[0] );
			}, 25 );
		}
	}
}