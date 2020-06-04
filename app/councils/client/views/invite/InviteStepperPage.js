import { Box, Margins, Scrollable, Tile } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useWipeInitialPageLoading } from '../../../../../client/hooks/useWipeInitialPageLoading';
import { ConnectionStatusAlert } from '../../../../../client/components/connectionStatus/ConnectionStatusAlert';
import { finalStep } from './InvitePageState';
import FinalInviteStep from './steps/FinalInviteStep';
import SideBar from './SideBar';
import NewParticipantStep from './steps/NewParticipantStep';


function InviteStepperPage({ currentStep = 1, councilInfo}) {
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
			|| <>
				<SideBar
					steps={[
						{
							step: 1,
							title: t('Council_participant_info'),
						},
					]}
					currentStep={currentStep}
					councilInfo={councilInfo}
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
								<NewParticipantStep step={1} title={t('Council_participant_info')} active={currentStep === 1}></NewParticipantStep>
								{/* <AdminUserInformationStep step={1} title={t('Admin_Info')} active={currentStep === 1} />
								<SettingsBasedStep step={2} title={t('Organization_Info')} active={currentStep === 2} />
								<SettingsBasedStep step={3} title={t('Server_Info')} active={currentStep === 3} />
								<RegisterServerStep step={4} title={t('Register_Server')} active={currentStep === 4} />*/}
							</Tile>
						</Margins>
					</Scrollable>
				</Box>
			</>}
		</Box>
	</>;
}

export default InviteStepperPage;
