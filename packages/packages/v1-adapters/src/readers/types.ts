export type ExtendedWindow = Window & {
	$e: {
		routes: {
			isPartOf: ( route: string ) => boolean;
		}
	},
	elementor: {
		channels: {
			dataEditMode: {
				request: ( key: 'activeMode' ) => 'edit' | 'preview' | 'picker';
			}
		}
	}
}
