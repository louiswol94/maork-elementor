import FormText from './pages/form-text';
import Connect from './pages/connect';
import FormCode from './pages/form-code';
import GetStarted from './pages/get-started';
import Loader from './components/loader';
import useUserInfo from './hooks/use-user-info';
import WizardDialog from './components/wizard-dialog';
import PromptDialog from './components/prompt-dialog';
import UpgradeChip from './components/upgrade-chip';
import FormMedia from './pages/form-media';

const PageContent = (
	{
		type,
		controlType,
		onClose,
		onConnect,
		getControlValue,
		setControlValue,
		controlView,
		additionalOptions,
	} ) => {
	const { isLoading, isConnected, isGetStarted, connectUrl, fetchData, hasSubscription, credits, usagePercentage } = useUserInfo();

	if ( isLoading ) {
		return (
			<PromptDialog onClose={ onClose }>
				<PromptDialog.Header onClose={ onClose } />

				<PromptDialog.Content>
					<Loader />
				</PromptDialog.Content>
			</PromptDialog>
		);
	}

	if ( ! isConnected ) {
		return (
			<WizardDialog onClose={ onClose }>
				<WizardDialog.Header onClose={ onClose } />

				<WizardDialog.Content>
					<Connect
						connectUrl={ connectUrl }
						onSuccess={ ( data ) => {
							onConnect( data );
							fetchData();
						} }
					/>
				</WizardDialog.Content>
			</WizardDialog>
		);
	}

	if ( ! isGetStarted ) {
		return (
			<WizardDialog onClose={ onClose }>
				<WizardDialog.Header onClose={ onClose } />

				<WizardDialog.Content>
					<GetStarted onSuccess={ fetchData } />
				</WizardDialog.Content>
			</WizardDialog>
		);
	}

	if ( 'code' === type ) {
		return (
			<PromptDialog onClose={ onClose }>
				<PromptDialog.Header onClose={ onClose }>
					{ ! hasSubscription && <UpgradeChip /> }
				</PromptDialog.Header>

				<PromptDialog.Content>
					<FormCode
						onClose={ onClose }
						getControlValue={ getControlValue }
						setControlValue={ setControlValue }
						additionalOptions={ additionalOptions }
						credits={ credits }
						usagePercentage={ usagePercentage }
					/>
				</PromptDialog.Content>
			</PromptDialog>
		);
	}

	if ( 'media' === type ) {
		return (
			<PromptDialog onClose={ onClose } maxWidth={ 'lg' } scroll="paper">
				<PromptDialog.Header onClose={ onClose }>
					{ ! hasSubscription && <UpgradeChip /> }
				</PromptDialog.Header>

				<FormMedia
					type={ type }
					controlType={ controlType }
					onClose={ onClose }
					getControlValue={ getControlValue }
					setControlValue={ setControlValue }
					controlView={ controlView }
					additionalOptions={ additionalOptions }
					credits={ credits }
				/>
			</PromptDialog>
		);
	}

	return (
		<PromptDialog onClose={ onClose }>
			<PromptDialog.Header onClose={ onClose }>
				{ ! hasSubscription && <UpgradeChip /> }
			</PromptDialog.Header>

			<PromptDialog.Content>
				<FormText
					type={ type }
					controlType={ controlType }
					onClose={ onClose }
					getControlValue={ getControlValue }
					setControlValue={ setControlValue }
					additionalOptions={ additionalOptions }
					credits={ credits }
					usagePercentage={ usagePercentage }
				/>
			</PromptDialog.Content>
		</PromptDialog>
	);
};

PageContent.propTypes = {
	type: PropTypes.string,
	controlType: PropTypes.string,
	onClose: PropTypes.func.isRequired,
	onConnect: PropTypes.func.isRequired,
	getControlValue: PropTypes.func.isRequired,
	setControlValue: PropTypes.func.isRequired,
	additionalOptions: PropTypes.object,
	controlView: PropTypes.object,
};

export default PageContent;
