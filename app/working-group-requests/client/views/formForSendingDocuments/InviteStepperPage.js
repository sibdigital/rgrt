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
import VerticalBar from '../../../../../client/components/basic/VerticalBar';
import { ProtocolChoose } from '../ProtocolChoose';
import { ItemsChoose, SectionChoose } from '../ItemsChoose';

function InviteStepperPage({ currentStep = 1, workingGroupRequest = {}, workingGroupRequestProtocol = null, protocolsData = [], userInfo = null }) {
	useWipeInitialPageLoading();
	const t = useTranslation();
	const small = useMediaQuery('(max-width: 760px)');
	const [info, setInfo] = useState({});
	const [context, setContext] = useState('');
	const [protocolId, setProtocolId] = useState('');
	const [protocol, setProtocol] = useState(workingGroupRequestProtocol);
	const [section, setSection] = useState(null);
	const [protocolItemsId, setProtocolItemsId] = useState([]);
	const [workingGroupRequestData, setWorkingGroupRequestData] = useState(workingGroupRequest);
	const stepStyle = { width: '80%', maxWidth: '1200px' };

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
			{(currentStep === finalStep && <FinalInviteStep fileDownloadInfo={info}/>)
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
							title: t('Working_group_request_invite_file_downloads'),
						},
						{
							step: 3,
							title: t('Working_group_request_invite_contact_data'),
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
								<WorkingGroupRequestInfoStep
									stepStyle={stepStyle}
									step={1}
									title={t('Working_group_request_info')}
									active={currentStep === 1}
									setWorkingGroupRequestData={setWorkingGroupRequestData}
								/>
								<WorkingGroupRequestAnswerFileDownloadStep
									stepStyle={stepStyle}
									step={2}
									title={t('Working_group_request_invite_file_downloads')}
									active={currentStep === 2}
									workingGroupRequest={workingGroupRequestData}
									protocol={workingGroupRequestProtocol}
									protocolsData={protocolsData}
									setInfo={setInfo}
									setVerticalContext={setContext}
									protocolSelected={protocol}
									setProtocolSelected={setProtocol}
									sectionSelected={section}
									setSectionSelected={setSection}
									protocolItemsId={protocolItemsId}
									setProtocolItemsId={setProtocolItemsId}
								/>
								<WorkingGroupRequestAnswerStep
									stepStyle={stepStyle}
									step={3}
									title={t('Working_group_request_invite_contact_data')}
									active={currentStep === 3}
									userInfo={userInfo}
									fileDownloadInfo={info}
								/>
							</Tile>
						</Margins>
					</Scrollable>
				</Box>
				{context
				&& <VerticalBar className='contextual-bar' style={{ flex: 'auto' }} width='x80' qa-context-name={`admin-user-and-room-context-${ context }`}>
					<VerticalBar.Header>
						{ context === 'protocolSelect' && t('Protocol_Choose') }
						{ context === 'protocolSectionSelect' && t('Protocol_Section_Choose') }
						{ context === 'protocolItemSelect' && t('Protocol_Item_Choose') }
						<VerticalBar.Close onClick={() => setContext('')}/>
					</VerticalBar.Header>
					<VerticalBar.ScrollableContent>
						{context === 'protocolSelect' && <ProtocolChoose setProtocolId={setProtocolId} setProtocol={setProtocol} close={() => setContext('')}/>}
						{context === 'protocolSectionSelect' && <SectionChoose sectionArray={protocol?.sections ?? []} setSection={setSection} close={() => setContext('')}/>}
						{context === 'protocolItemSelect' && <ItemsChoose protocolId={protocolId} setProtocolItemsId={() => console.log('')} setProtocolItems={setProtocolItemsId} close={() => setContext('')}/>}
					</VerticalBar.ScrollableContent>
				</VerticalBar>}
			</>}
		</Box>
	</>;
}

export default InviteStepperPage;
