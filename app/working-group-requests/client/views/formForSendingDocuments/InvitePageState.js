import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { useRouteParameter, useRoute } from '../../../../../client/contexts/RouterContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../../client/hooks/useEndpointDataExperimental';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import InviteStepperPage from './InviteStepperPage';
import { useUser, useUserId } from '../../../../../client/contexts/UserContext';

export const finalStep = 'final';
export const errorStep = 'error';

const useStepRouting = () => {
	const param = useRouteParameter('step');
	const workingGroupRequestId = useRouteParameter('id');
	const invitePageRoute = useRoute('request-answer');

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
		invitePageRoute.replace({ step: String(currentStep), id: workingGroupRequestId });
	}, [invitePageRoute, workingGroupRequestId, currentStep]);

	return [currentStep, setCurrentStep, workingGroupRequestId];
};

const InvitePageContext = createContext({
	goToPreviousStep: () => {},
	goToNextStep: () => {},
	goToFinalStep: () => {},
	goToErrorStep: () => {},
});

function InvitePageState() {
	const t = useTranslation();
	const [currentStep, setCurrentStep, workingGroupRequestId] = useStepRouting();
	const userId = useUserId();
	const currentUser = useUser();

	const endPoint = workingGroupRequestId === 'all' ? 'working-groups-requests.inviteList' : 'working-groups-requests.getOneByInviteLink';
	const query = useMemo(() => {
		if (workingGroupRequestId !== 'all') {
			return {
				query: JSON.stringify({ inviteLink: workingGroupRequestId }),
			};
		}
		return {
			fields: JSON.stringify({ protocol: 1, requestType: 1, mail: 1, protocolItemsId: 1, desc: 1, date: 1, ts: 1, number: 1, createdBy: 1 }),
		};
	}, [workingGroupRequestId]);

	const { data, state, error } = useEndpointDataExperimental(endPoint, query);
	const { data: protocolData, state: protocolState } = useEndpointDataExperimental('protocols.inviteFindOne', useMemo(() => ({
		query: JSON.stringify({ _id: workingGroupRequestId === 'all' ? '' : data?.protocol?._id ?? '' }),
	}), [data, workingGroupRequestId]));
	const { data: userInfo, state: userState } = useEndpointDataExperimental('persons.findOne', useMemo(() => ({
		query: JSON.stringify({ userId }),
		fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1, phone: 1, email: 1 }),
	}), [userId]));

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
		workingGroupRequestState: { data, state, workingGroupRequestId },
		// protocolDataState: { protocolData, protocolState, workingGroupRequestId },
		// protocolItemsDataState: { protocolItemsData, protocolItemsState, workingGroupRequestId },
	}), [
		currentStep,
		data,
		state,
		// protocolData,
		// protocolState,
		// protocolItemsData,
		// protocolItemsState,
		workingGroupRequestId,
	]);

	if ([state, userState, protocolState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16'>{ t('Loading') }</Callout>;
	}
	console.dir({ data, currentUser, userId });

	if (currentStep !== errorStep) {
		try {
			!data && !data.desc;
			!data && !data.inviteLink;
			!data && !data._id;
		} catch (e) {
			goToErrorStep();
		}
	}

	return <InvitePageContext.Provider value={value}>
		<InviteStepperPage currentStep={currentStep} workingGroupRequest={data} workingGroupRequestProtocol={protocolData} userInfo={userInfo}/>
	</InvitePageContext.Provider>;
}

export const useInvitePageContext = () => useContext(InvitePageContext);

export default InvitePageState;
