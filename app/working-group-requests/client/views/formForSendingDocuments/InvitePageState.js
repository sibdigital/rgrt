import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { useRouteParameter, useRoute } from '../../../../../client/contexts/RouterContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../../client/hooks/useEndpointDataExperimental';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import InviteStepperPage from './InviteStepperPage';
import { useUserId } from '../../../../../client/contexts/UserContext';

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

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	//query: JSON.stringify({ _id: { $regex: text || '', $options: 'i' } }),
	//fields: JSON.stringify({ sections: 1, num: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, itemsPerPage, current, column, direction]);

function InvitePageState() {
	const t = useTranslation();
	const [currentStep, setCurrentStep, workingGroupRequestId] = useStepRouting();
	const userId = useUserId();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['num']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const protocolsQuery = useQuery(debouncedParams, debouncedSort);

	const query = useMemo(() => ({
		query: JSON.stringify({ inviteLink: workingGroupRequestId }),
	}), [workingGroupRequestId]);

	const { data, state, error } = useEndpointDataExperimental('working-groups-requests.getOneByInviteLink', query);
	const { data: protocolsData, state: protocolsState } = useEndpointDataExperimental('protocols.list.requestAnswer', protocolsQuery);
	const { data: userInfo, state: userState } = useEndpointDataExperimental('users.getOne', useMemo(() => ({
		query: JSON.stringify({ _id: userId }),
		fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1, phone: 1, emails: 1 }),
	}), []));

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
		workingGroupRequestState: { data, state },
	}), [
		currentStep,
		data,
		state,
		error,
	]);

	if ([state, protocolsState, userState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16' type='danger'>{ t('Loading') }</Callout>;
	}

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
		<InviteStepperPage currentStep={currentStep} workingGroupRequest={data} protocolsData={protocolsData?.protocols || []} userInfo={userInfo}/>
	</InvitePageContext.Provider>;
}

export const useInvitePageContext = () => useContext(InvitePageContext);

export default InvitePageState;
