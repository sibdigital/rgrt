import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Skeleton, Scrollable, Margins, InputBox } from '@rocket.chat/fuselage';

import { useRouteParameter, useRoute } from '../../../../../client/contexts/RouterContext';
import InviteStepperPage from './InviteStepperPage';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../../client/hooks/useEndpointDataExperimental';


export const finalStep = 'final';
export const errorStep = 'error';

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
		invitePageRoute.replace({ step: String(currentStep), id: councilId });
	}, [invitePageRoute, councilId, currentStep]);

	return [currentStep, setCurrentStep, councilId];
};

const InvitePageContext = createContext({
	goToPreviousStep: () => {},
	goToNextStep: () => {},
	goToFinalStep: () => {},
	goToErrorStep: () => {},
});

function InvitePageState() {
	const [currentStep, setCurrentStep, councilId] = useStepRouting();

	const query = useMemo(() => ({
		query: JSON.stringify({ inviteLink: councilId }),
	}), [councilId]);

	const { data, state, error } = useEndpointDataExperimental('councils.getOneByInviteLink', query);

	const goToPreviousStep = useCallback(() => setCurrentStep((currentStep) => (currentStep !== 1 ? currentStep - 1 : currentStep)), []);
	const goToNextStep = useCallback(() => setCurrentStep((currentStep) => currentStep + 1), []);
	const goToFinalStep = useCallback(() => setCurrentStep(finalStep), []);
	const goToErrorStep = useCallback(() => setCurrentStep(errorStep), []);

	const value = useMemo(() => ({
		currentStep,
		goToPreviousStep,
		goToNextStep,
		goToFinalStep,
		goToErrorStep,
		councilState: { data, state },
	}), [
		currentStep,
		data,
		state,
		error,
	]);

	if ([state].includes(ENDPOINT_STATES.LOADING)) {
		return <Box/>;
	}

	if (currentStep !== errorStep) {
		try {
			!data && !data.desc;
			!data && !data.d;
		} catch (e) {
			goToErrorStep();
		}
	}

	if (ENDPOINT_STATES.LOADING === state) {
		return <Box/>;
	}


	return <InvitePageContext.Provider value={value}>
		<InviteStepperPage currentStep={currentStep} council={data}/>
	</InvitePageContext.Provider>;
}

export const useInvitePageContext = () => useContext(InvitePageContext);

export default InvitePageState;
