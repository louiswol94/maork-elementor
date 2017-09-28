<?php
namespace Elementor;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

abstract class Widget_Base extends Element_Base {

	protected $_has_template_content = true;

	public static function get_type() {
		return 'widget';
	}

	public static function get_inline_editing_basic_tools() {
		return [
			'bold',
			'italic',
			'underline',
			'strikethrough',
		];
	}

	public static function get_inline_editing_advanced_tools() {
		return array_merge( self::get_inline_editing_basic_tools(), [
			'createlink',
			'h1' => [
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
				'p',
				'blockquote',
				'code',
			],
			'list' => [
				'insertorderedlist',
				'insertorderedlist',
			],
			'indent' => [
				'indent',
				'outdent',
			],
		] );
	}

	protected static function get_default_edit_tools() {
		$widget_label = __( 'Widget', 'elementor' );

		return [
			'duplicate' => [
				'title' => sprintf( __( 'Duplicate %s', 'elementor' ), $widget_label ),
				'icon' => 'clone',
			],
			'remove' => [
				'title' => sprintf( __( 'Remove %s', 'elementor' ), $widget_label ),
				'icon' => 'close',
			],
		];
	}

	public function get_icon() {
		return 'eicon-apps';
	}

	public function get_keywords() {
		return [];
	}

	public function get_categories() {
		return [ 'basic' ];
	}

	/**
	 * Whether inline editing is supported by this widget or not.
	 *
	 * @access public
	 *
	 * @return bool
	 */
	public function is_inline_editing_supported() {
		return false;
	}

	public function __construct( $data = [], $args = null ) {
		parent::__construct( $data, $args );

		$is_type_instance = $this->is_type_instance();

		if ( ! $is_type_instance && null === $args ) {
			throw new \Exception( '`$args` argument is required when initializing a full widget instance' );
		}

		if ( $is_type_instance ) {
			$this->_register_skins();

			do_action( 'elementor/widget/' . $this->get_name() . '/skins_init', $this );
		}
	}

	public function show_in_panel() {
		return true;
	}

	public function start_controls_section( $section_id, array $args ) {
		parent::start_controls_section( $section_id, $args );

		static $is_first_section = true;

		if ( $is_first_section ) {
			$this->_register_skin_control();

			$is_first_section = false;
		}
	}

	private function _register_skin_control() {
		$skins = $this->get_skins();
		if ( ! empty( $skins ) ) {
			$skin_options = [];

			if ( $this->_has_template_content ) {
				$skin_options[''] = __( 'Default', 'elementor' );
			}

			foreach ( $skins as $skin_id => $skin ) {
				$skin_options[ $skin_id ] = $skin->get_title();
			}

			// Get the first item for default value
			$default_value = array_keys( $skin_options );
			$default_value = array_shift( $default_value );

			if ( 1 >= count( $skin_options ) ) {
				$this->add_control(
					'_skin',
					[
						'label' => __( 'Skin', 'elementor' ),
						'type' => Controls_Manager::HIDDEN,
						'default' => $default_value,
					]
				);
			} else {
				$this->add_control(
					'_skin',
					[
						'label' => __( 'Skin', 'elementor' ),
						'type' => Controls_Manager::SELECT,
						'default' => $default_value,
						'options' => $skin_options,
					]
				);
			}
		}
	}

	protected function _register_skins() {}

	protected function _get_initial_config() {
		$config = [
			'widget_type' => $this->get_name(),
			'keywords' => $this->get_keywords(),
			'categories' => $this->get_categories(),
		];

		if ( $this->is_inline_editing_supported() ) {
			$config['inlineEditing'] = $this->get_inline_editing_config();
		}

		return array_merge( parent::_get_initial_config(), $config );
	}

	final public function print_template() {
		ob_start();

		$this->_content_template();

		$content_template = ob_get_clean();

		$content_template = apply_filters( 'elementor/widget/print_template', $content_template,  $this );

		if ( empty( $content_template ) ) {
			return;
		}
		?>
		<script type="text/html" id="tmpl-elementor-<?php echo static::get_type(); ?>-<?php echo esc_attr( $this->get_name() ); ?>-content">
			<?php $this->_render_settings(); ?>
			<div class="elementor-widget-container">
				<?php echo $content_template; ?>
			</div>
		</script>
		<?php
	}

	protected function _render_settings() {
		?>
		<div class="elementor-element-overlay">
			<ul class="elementor-editor-element-settings elementor-editor-widget-settings">
				<li class="elementor-editor-element-setting elementor-editor-element-trigger" title="<?php printf( __( 'Edit %s', 'elementor' ), __( 'Widget', 'elementor' ) ); ?>">
					<i class="eicon-edit"></i>
				</li>
				<?php foreach ( self::get_edit_tools() as $edit_tool_name => $edit_tool ) : ?>
					<li class="elementor-editor-element-setting elementor-editor-element-<?php echo $edit_tool_name; ?>" title="<?php echo $edit_tool['title']; ?>">
						<span class="elementor-screen-only"><?php echo $edit_tool['title']; ?></span>
						<i class="eicon-<?php echo $edit_tool['icon']; ?>"></i>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
		<?php
	}

	protected function parse_text_editor( $content ) {
		$content = apply_filters( 'widget_text', $content, $this->get_settings() );

		$content = shortcode_unautop( $content );
		$content = do_shortcode( $content );

		if ( $GLOBALS['wp_embed'] instanceof \WP_Embed ) {
			$content = $GLOBALS['wp_embed']->autoembed( $content );
		}

		return $content;
	}

	public function render_content() {
		do_action( 'elementor/widget/before_render_content', $this );

		if ( Plugin::$instance->editor->is_edit_mode() ) {
			$this->_render_settings();
		}

		?>
		<div class="elementor-widget-container">
			<?php
			ob_start();

			$skin = $this->get_current_skin();
			if ( $skin ) {
				$skin->set_parent( $this );
				$skin->render();
			} else {
				$this->render();
			}

			echo apply_filters( 'elementor/widget/render_content', ob_get_clean(), $this );
			?>
		</div>
		<?php
	}

	public function render_plain_content() {
		$this->render_content();
	}

	protected function _add_render_attributes() {
		parent::_add_render_attributes();

		$this->add_render_attribute(
			'_wrapper', 'class', [
				'elementor-widget',
				'elementor-widget-' . $this->get_name(),
			]
		);

		$settings = $this->get_settings();

		$this->add_render_attribute( '_wrapper', 'data-element_type', $this->get_name() . '.' . ( ! empty( $settings['_skin'] ) ? $settings['_skin'] : 'default' ) );
	}

	public function before_render() {
		?>
		<div <?php echo $this->get_render_attribute_string( '_wrapper' ); ?>>
		<?php
	}

	public function after_render() {
		?>
		</div>
		<?php
	}

	public function get_raw_data( $with_html_content = false ) {
		$data = parent::get_raw_data( $with_html_content );

		unset( $data['isInner'] );

		$data['widgetType'] = $this->get_data( 'widgetType' );

		if ( $with_html_content ) {
			ob_start();

			$this->render_content();

			$data['htmlCache'] = ob_get_clean();
		}

		return $data;
	}

	protected function _print_content() {
		$this->render_content();
	}

	protected function get_default_data() {
		$data = parent::get_default_data();

		$data['widgetType'] = '';

		return $data;
	}

	protected function _get_default_child_type( array $element_data ) {
		return Plugin::$instance->elements_manager->get_element_types( 'section' );
	}

	protected function get_inline_editing_config() {
		return [ 'buttons' => self::get_inline_editing_basic_tools() ];
	}

	protected function add_inline_editing_attributes( $inline_editing_key ) {
		if ( ! Plugin::$instance->editor->is_edit_mode() ) {
			return;
		}

		if ( ! $this->is_inline_editing_supported() ) {
			_doing_it_wrong( get_called_class() . '::' . __FUNCTION__, 'You must enable inline editing first (Use `is_inline_editing_supported()`).', '1.8.0' );

			return;
		}

		$inline_editing_key = (array) $inline_editing_key;

		foreach ( $inline_editing_key as $key ) {
			$this->add_render_attribute( $key, [
				'class' => 'elementor-inline-editing',
				'data-elementor-setting-key' => $key,
			] );
		}
	}

	public function add_skin( Skin_Base $skin ) {
		Plugin::$instance->skins_manager->add_skin( $this, $skin );
	}

	public function get_skin( $skin_id ) {
		$skins = $this->get_skins();
		if ( isset( $skins[ $skin_id ] ) ) {
			return $skins[ $skin_id ];
		}

		return false;
	}

	public function get_current_skin_id() {
		return $this->get_settings( '_skin' );
	}

	public function get_current_skin() {
		return $this->get_skin( $this->get_current_skin_id() );
	}

	public function remove_skin( $skin_id ) {
		return Plugin::$instance->skins_manager->remove_skin( $this, $skin_id );
	}

	/**
	 * @return Skin_Base[]
	 */
	public function get_skins() {
		return Plugin::$instance->skins_manager->get_skins( $this );
	}
}
