import { Box, Margins, Scrollable, Tile } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useState, useCallback } from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useWipeInitialPageLoading } from '../../../../../client/hooks/useWipeInitialPageLoading';
import ConnectionStatusAlert from '../../../../../client/components/connectionStatus/ConnectionStatusAlert';
import { errorStep, finalStep } from './InvitePageState';
import FinalInviteStep from './steps/FinalInviteStep';
import SideBar from './SideBar';
import NewParticipantStep from './steps/NewParticipantStep';
import ErrorInviteStep from './steps/ErrorInviteStep';
import CouncilInfoStep from './steps/CouncilInfoStep';
import ProposalForTheAgendaStep from './steps/ProposalForTheAgendaStep';

function InviteStepperPage({ currentStep = 1, council = {}, agendaId = null }) {
	useWipeInitialPageLoading();
	const t = useTranslation();
	const small = useMediaQuery('(max-width: 760px)');

	const [isAgenda, setIsAgenda] = useState(!!agendaId);
	const [userData, setUserData] = useState(false);

	console.log(agendaId);
	console.log(isAgenda);

	const setUserDataClick = useCallback((data) => setUserData(data), []);

	return <>
		<ConnectionStatusAlert />
		<Box
			width='full'
			height='sh'
			display='flex'
			flexDirection={small ? 'column' : 'row'}
			alignItems='stretch'
			style={{ backgroundColor: 'var(--color-dark-05, #f1f2f4)' }}
		>
			{(currentStep === finalStep && <FinalInviteStep />)
			|| (currentStep === errorStep && <ErrorInviteStep />)
			|| <>
				<SideBar
					steps={[
						{
							step: 1,
							title: t('Council_info'),
						},
						{
							step: 2,
							title: t('Council_participant_info'),
						},
						{
							step: 3,
							title: t('Proposal_for_the_agenda'),
						},
					]}
					currentStep={currentStep}
				/>
				<Box
					flexGrow={1}
					flexShrink={1}
					minHeight='none'
					display='flex'
					flexDirection='column'
				>
					<Scrollable>
						<Margins all='x16'>
							<Tile is='section' flexGrow={1} flexShrink={1}>
								<CouncilInfoStep step={1} title={t('Council_info')} active={currentStep === 1}/>
								<NewParticipantStep step={2} title={t('Council_participant_info')} active={currentStep === 2} council={council} isAgenda={isAgenda} setUserDataClick={setUserDataClick}/>
								<ProposalForTheAgendaStep step={3} title={t('Proposal_for_the_agenda')} active={currentStep === 3} council={council} userData={userData} agendaId={agendaId}/>
							</Tile>
						</Margins>
					</Scrollable>
				</Box>
			</>}
		</Box>
	</>;
}

export default InviteStepperPage;
