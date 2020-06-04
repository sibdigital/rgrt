import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { useRouteParameter, useRoute } from '../../../../../client/contexts/RouterContext';
import InviteStepperPage from './InviteStepperPage';

export const finalStep = 'final';

const useStepRouting = () => {
	const param = useRouteParameter('step');
	const councilId = useRouteParameter('id');
	const invitePageRoute = useRoute('council-invite');

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
		invitePageRoute.replace({ step: String(currentStep) });
	}, [invitePageRoute, councilId, currentStep]);

	return [currentStep, setCurrentStep, councilId];
};

const InvitePageContext = createContext({
	goToPreviousStep: () => {},
	goToNextStep: () => {},
	goToFinalStep: () => {},
});

function InvitePageState() {
	const [currentStep, setCurrentStep, councilId] = useStepRouting();


	const goToPreviousStep = useCallback(() => setCurrentStep((currentStep) => (currentStep !== 1 ? currentStep - 1 : currentStep)), []);
	const goToNextStep = useCallback(() => setCurrentStep((currentStep) => currentStep + 1), []);
	const goToFinalStep = useCallback(() => setCurrentStep(finalStep), []);
	const councilInfo = { name: 'hello' };

	const value = useMemo(() => ({
		currentStep,
		goToPreviousStep,
		goToNextStep,
		goToFinalStep,
	}), [
		currentStep,
	]);

	return <InvitePageContext.Provider value={value}>
		<InviteStepperPage currentStep={currentStep} councilInfo={councilInfo}/>
	</InvitePageContext.Provider>;
}

export const useInvitePageContext = () => useContext(InvitePageContext);

export default InvitePageState;
