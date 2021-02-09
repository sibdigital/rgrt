import { Box, Margins, Scrollable, Tile } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useWipeInitialPageLoading } from '../../../../../client/hooks/useWipeInitialPageLoading';
import ConnectionStatusAlert from '../../../../../client/components/connectionStatus/ConnectionStatusAlert';
import { errorStep, finalStep } from './InvitePageState';
import SideBar from './SideBar';
import ErrorInviteStep from './steps/ErrorInviteStep';
import FinalInviteStep from './steps/FinalInviteStep';
import WorkingGroupRequestAnswerStep from './steps/WorkingGroupRequestAnswerStep';
import WorkingGroupRequestAnswerFileDownloadStep from './steps/WorkingGroupRequestAnswerFileDownloadStep';
import WorkingGroupRequestInfoStep from './steps/WorkingGroupRequestInfoStep';

function InviteStepperPage({ currentStep = 1, workingGroupRequest = {}, protocolsData = [] }) {
	useWipeInitialPageLoading();
	const t = useTranslation();
	const small = useMediaQuery('(max-width: 760px)');
	const [contactInfo, setContactInfo] = useState({});

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
							title: t('Working_group_request_info'),
						},
						{
							step: 2,
							title: t('Working_group_request_invite_contact_data'),
						},
						{
							step: 3,
							title: t('Working_group_request_invite_file_downloads'),
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
								<WorkingGroupRequestInfoStep step={1} title={t('Working_group_request_info')} active={currentStep === 1}/>
								<WorkingGroupRequestAnswerStep step={2} title={t('Working_group_request_invite_contact_data')} active={currentStep === 2} setContactInfo={setContactInfo}/>
								<WorkingGroupRequestAnswerFileDownloadStep step={3} title={t('Working_group_request_invite_file_downloads')} active={currentStep === 3} workingGroupRequest={workingGroupRequest} protocolsData={protocolsData} contactInfoData={contactInfo}/>
							</Tile>
						</Margins>
					</Scrollable>
				</Box>
			</>}
		</Box>
	</>;
}

export default InviteStepperPage;