import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { useRouteParameter, useRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useUserId } from '../../../../../client/contexts/UserContext';
import InviteStepperPage from './InviteStepperPage';

export const finalStep = 'final';

const useStepRouting = () => {
	const param = useRouteParameter('step');
	const userId = useUserId();
	const setupWizardRoute = useRoute('setup-wizard');

	const [currentStep, setCurrentStep] = useState(() => {
		if (param === finalStep) {
			return finalStep;
		}

		const step = parseInt(param, 10);
		if (Number.isFinite(step) && step >= 1) {
			return step;
		}

		return 1;
	});

	useEffect(() => {
		if (!userId) {
			setCurrentStep(1);
		} else if (currentStep === 1) {
			setCurrentStep(2);
		}

		setupWizardRoute.replace({ step: String(currentStep) });
	}, [setupWizardRoute, userId, currentStep]);

	return [currentStep, setCurrentStep];
};

const useParameters = () => {
	const [loaded, setLoaded] = useState(false);
	const [settings, setSettings] = useState([]);
	const [canDeclineServerRegistration, setCapableOfDeclineServerRegistration] = useState(false);
	const getSetupWizardParameters = useMethod('getSetupWizardParameters');

	useEffect(() => {
		let mounted = true;
		const requestParameters = async () => {
			try {
				const {
					settings = [],
					allowStandaloneServer = false,
				} = await getSetupWizardParameters() || {};

				if (!mounted) {
					return;
				}

				setLoaded(true);
				setSettings(settings);
				setCapableOfDeclineServerRegistration(allowStandaloneServer);
			} catch (error) {
				setLoaded(false);
				setSettings([]);
				setCapableOfDeclineServerRegistration(false);
			}
		};

		requestParameters();

		return () => {
			mounted = false;
		};
	}, []);

	return {
		loaded,
		settings,
		canDeclineServerRegistration,
	};
};

const InvitePageContext = createContext({
	loaded: false,
	settings: [],
	canDeclineServerRegistration: false,
	goToPreviousStep: () => {},
	goToNextStep: () => {},
	goToFinalStep: () => {},
});

function InvitePageState() {
	const [currentStep, setCurrentStep] = useStepRouting();
	const {
		loaded,
		settings,
		canDeclineServerRegistration,
	} = useParameters();

	const goToPreviousStep = useCallback(() => setCurrentStep((currentStep) => currentStep - 1), []);
	const goToNextStep = useCallback(() => setCurrentStep((currentStep) => currentStep + 1), []);
	const goToFinalStep = useCallback(() => setCurrentStep(finalStep), []);

	const value = useMemo(() => ({
		currentStep,
		loaded,
		settings,
		canDeclineServerRegistration,
		goToPreviousStep,
		goToNextStep,
		goToFinalStep,
	}), [
		currentStep,
		loaded,
		settings,
		canDeclineServerRegistration,
	]);

	return <InvitePageContext.Provider value={value}>
		<InviteStepperPage currentStep={currentStep} />
	</InvitePageContext.Provider>;
}

export const useInvitePageContext = () => useContext(InvitePageContext);

export default InvitePageState;
