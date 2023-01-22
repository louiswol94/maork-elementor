<?php
namespace Elementor\Modules\LazyLoad;

use Elementor\Core\Base\Module as BaseModule;
use Elementor\Core\Experiments\Manager as Experiments_Manager;
use Elementor\Element_Base;
use Elementor\Utils;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class Module extends BaseModule {

	const EXPERIMENT_NAME = 'e_lazyload';

	public function get_name() {
		return 'lazyload';
	}

	public static function get_experimental_data() {
		return [
			'name' => static::EXPERIMENT_NAME,
			'title' => esc_html__( 'Lazy Load Background Images', 'elementor' ),
			'tag' => esc_html__( 'Performance', 'elementor' ),
			'description' => esc_html__( 'Lazy loading images that are not in the viewport improves initial page load performance and user experience. By activating this experiment all background images except the first one on your page will be lazy loaded to improve your LCP score', 'elementor' ),
			'release_status' => Experiments_Manager::RELEASE_STATUS_ALPHA,
			'default' => Experiments_Manager::STATE_INACTIVE,
		];
	}

	private function enqueue_styles() {
		wp_enqueue_style(
			'elementor-lazyload',
			$this->get_css_assets_url( 'modules/lazyload/frontend' ),
			[],
			ELEMENTOR_VERSION
		);
	}

	private function update_element_attributes( Element_Base $element ) {
		$settings = $element->get_settings_for_display();
		$controls = $element->get_controls();
		$lazyload_attribute_name = 'data-e-bg-lazyload';
		$attributes = [];
		$controls_with_background_image = array_filter( $controls, function( $control ) {
			return Utils::get_array_value_by_keys( $control, [ 'background_lazyload', 'active' ] );
		} );

		$reapeter = array_filter( $controls, function( $control ) {
			if ( 'repeater' === $control['type'] && Utils::get_array_value_by_keys( $control, [ 'fields', 'background_image', 'fields_options', 'image', 'background_lazyload', 'active' ] ) ) {
				return true;
			}
		} );
		$reapeter = array_shift( $reapeter );

		foreach ( $controls_with_background_image as $control_name => $control_data ) {

			// If the control is a repeater, we need to loop over the repeater fields and update the background image, And setting the lazyload attribute to the repeater container.
			if ( $reapeter ) {
				$lazyload_options = Utils::get_array_value_by_keys( $reapeter, [ 'fields', 'background_image', 'fields_options', 'image', 'background_lazyload' ] );
				$control_data['background_lazyload'] = array_merge( $control_data['background_lazyload'], $lazyload_options );

				// Get lazyload property from the repeater first control.
				$settings = $settings[ $reapeter['name'] ][0];
				$attributes['data-e-bg-repeater'] = '';
			}

			$keys = Utils::get_array_value_by_keys( $control_data, [ 'background_lazyload', 'keys' ] );
			$background_image_url = Utils::get_array_value_by_keys( $settings, $keys );
			if ( $background_image_url ) {

				$has_attribute = $element->get_render_attributes( '_wrapper', $lazyload_attribute_name );
				if ( ! $has_attribute ) {
					$bg_selector = Utils::get_array_value_by_keys( $control_data, [ 'background_lazyload', 'selector' ] ) ?? '';
					$attributes[ $lazyload_attribute_name ] = $bg_selector;

					$element->add_render_attribute( '_wrapper',
						$attributes
					);
				}
			}
		}
	}

	private function append_lazyload_selector( $control, $value ) {
		if ( Utils::get_array_value_by_keys( $control, [ 'background_lazyload', 'active' ] ) ) {
			foreach ( $control['selectors'] as $selector => $css_property ) {
				if ( 0 === strpos( $css_property, 'background-image' ) ) {
					if ( ! empty( $value['url'] ) ) {
						$css_property  = str_replace( 'url("{{URL}}")', 'var(--e-bg-lazyload-loaded)', $css_property );
						$css_property  = str_replace( 'url({{URL}})', 'var(--e-bg-lazyload-loaded)', $css_property );

						$control['selectors'][ $selector ] = $css_property . ';--e-bg-lazyload: url("' . $value['url'] . '");';
						$control = $this->apply_dominant_color_background( $control, $value, $selector );
					}
				}
			}
		}
		return $control;
	}

	private function apply_dominant_color_background( $control, $value, $selector ) {
		$metadata = wp_get_attachment_metadata( $value['id'] );
		$dominant_color = Utils::get_array_value_by_keys( $metadata, [ 'dominant_color' ] );
		if ( $dominant_color ) {
			$control['selectors'][ $selector ] .= "background-color: #{$dominant_color};";
		}
		return $control;
	}

	public function __construct() {
		parent::__construct();

		// Disable lazyload in admin area (true if inside WordPress administration interface - Editor, Admin, etc.)
		if ( is_admin() ) {
			return;
		}

		add_action( 'elementor/element/after_add_attributes', function( Element_Base $element ) {
			$this->update_element_attributes( $element );
		} );

		add_filter('elementor/files/css/selectors', function( $control, $value ) {
			return $this->append_lazyload_selector( $control, $value );
		}, 10, 2 );

		add_filter( 'body_class', function( $classes ) {
			$classes[] = 'e-lazyload';
			return $classes;
		} );

		add_action( 'wp_enqueue_scripts', function() {
			$this->enqueue_styles();
		} );

		add_action( 'wp_footer', function() {
			?>
			<script type='text/javascript'>
				const lazyloadRunObserver = () => {
					const dataAttribute = 'data-e-bg-lazyload';
					const reapterAttribute = 'data-e-bg-repeater';

					let lazyloadBackgrounds = document.querySelectorAll( `[${ dataAttribute }]:not(.lazyloaded, [${reapterAttribute}])` );
					const lazyloadRepeaterBackgrounds = document.querySelectorAll( `[${ reapterAttribute }]` );
					if ( lazyloadRepeaterBackgrounds.length ) {
						const repeaterBackgrounds = [];
						lazyloadRepeaterBackgrounds.forEach( ( repeater ) => {
							const lazyloadSelector = repeater.getAttribute( dataAttribute );
							if ( lazyloadSelector ) {
								lazyloadBackground = repeater.querySelectorAll( lazyloadSelector );
								if ( lazyloadBackground.length ) {
									repeaterBackgrounds.push( ...lazyloadBackground );
								}
							}

						} );
						lazyloadBackgrounds = [ ...lazyloadBackgrounds, ...repeaterBackgrounds ];
					}

					const lazyloadBackgroundObserver = new IntersectionObserver( ( entries ) => {
					entries.forEach( ( entry ) => {
						if ( entry.isIntersecting ) {
							let lazyloadBackground = entry.target;
							const lazyloadSelector = lazyloadBackground.getAttribute( dataAttribute );
							if ( lazyloadSelector ) {
								lazyloadBackground = entry.target.querySelector( lazyloadSelector );
							}
							lazyloadBackground.classList.add( 'lazyloaded' );
							lazyloadBackgroundObserver.unobserve( entry.target );
						}
					});
					}, { rootMargin: '100px 0px 100px 0px' } );
					lazyloadBackgrounds.forEach( ( lazyloadBackground ) => {
						lazyloadBackgroundObserver.observe( lazyloadBackground );
					} );
				};
				const events = [
					'DOMContentLoaded',
					'elementor/lazyload/observe',
				];
				events.forEach( ( event ) => {
					document.addEventListener( event, lazyloadRunObserver );
				} );
			</script>
			<?php
		} );

	}
}
