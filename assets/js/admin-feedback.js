/* global jQuery, ElementorAdminFeedbackArgs */
( function( $ ) {
	'use strict';

	var ElementorAdminDialogApp = {

		cacheElements: function() {
			this.cache = {
				$deactivateLink: $( '#the-list' ).find( '[data-slug="elementor"] span.deactivate a' ),
				$dialogForm: $( '#elementor-deactivate-feedback-dialog-form' )
			};
		},

		bindEvents: function() {
			var self = this;

			self.cache.$deactivateLink.on( 'click', function( event ) {
				event.preventDefault();

				// Open Dialog
				var dialogManager = new DialogsManager.Instance(),
					modal = dialogManager.createWidget( 'confirm', {
						headerMessage: 'Feedback Title', // TODO: gettext
						message: self.cache.$dialogForm,
						contentWidth: 'auto',
						contentHeight: 'auto',
						strings: {
							confirm: 'Deactivate', // TODO: gettext
							cancel: 'Cancel' // TODO: gettext
						},
						defaultOption: 'cancel',
						onConfirm: _.bind( self.sendFeedback, self )
					} );

				modal.show();
			} );
		},

		sendFeedback: function() {
			var self = this;

			$.post( ajaxurl, self.cache.$dialogForm.serialize(), function( data ) {
				location.href = self.cache.$deactivateLink.attr( 'href' );
				//console.log( data );
			} );
		},

		init: function() {
			this.cacheElements();
			this.bindEvents();
		}
	};

	$( function() {
		ElementorAdminDialogApp.init();
	} );

}( jQuery ) );
