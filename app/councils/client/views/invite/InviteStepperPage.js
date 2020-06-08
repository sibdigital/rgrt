import { Box, Margins, Scrollable, Tile } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useWipeInitialPageLoading } from '../../../../../client/hooks/useWipeInitialPageLoading';
import { ConnectionStatusAlert } from '../../../../../client/components/connectionStatus/ConnectionStatusAlert';
import { errorStep, finalStep, useInvitePageContext } from './InvitePageState';
import FinalInviteStep from './steps/FinalInviteStep';
import SideBar from './SideBar';
import NewParticipantStep from './steps/NewParticipantStep';
import ErrorInviteStep from './steps/ErrorInviteStep';
import CouncilInfoStep from './steps/CouncilInfoStep';


function InviteStepperPage({ currentStep = 1 }) {
	useWipeInitialPageLoading();
	const t = useTranslation();
	const small = useMediaQuery('(max-width: 760px)');

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
								<CouncilInfoStep step={1} title={t('Council_info')} active={currentStep === 1}></CouncilInfoStep>
								<NewParticipantStep step={2} title={t('Council_participant_info')} active={currentStep === 2}></NewParticipantStep>
							</Tile>
						</Margins>
					</Scrollable>
				</Box>
			</>}
		</Box>
	</>;
}

export default InviteStepperPage;
