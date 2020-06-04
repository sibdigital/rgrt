import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { useRouteParameter, useRoute } from '../../../../../client/contexts/RouterContext';
import InviteStepperPage from './InviteStepperPage';
import { useEndpointDataExperimental } from '../../../../../client/hooks/useEndpointDataExperimental';

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

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);

	const { data, state, error } = useEndpointDataExperimental('councils.list', query);

	const goToPreviousStep = useCallback(() => setCurrentStep((currentStep) => (currentStep !== 1 ? currentStep - 1 : currentStep)), []);
	const goToNextStep = useCallback(() => setCurrentStep((currentStep) => currentStep + 1), []);
	const goToFinalStep = useCallback(() => setCurrentStep(finalStep), []);


	const value = useMemo(() => ({
		currentStep,
		goToPreviousStep,
		goToNextStep,
		goToFinalStep,
		councilState: { data, state, error },
	}), [
		currentStep,
		data,
		state,
		error,
	]);

	return <InvitePageContext.Provider value={value}>
		<InviteStepperPage currentStep={currentStep}/>
	</InvitePageContext.Provider>;
}

export const useInvitePageContext = () => useContext(InvitePageContext);

export default InvitePageState;
