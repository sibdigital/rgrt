import { Box, Margins, Scrollable } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import './SideBar.css';
import { getURL } from '../../../../utils';

function SideBar({
	logoSrc = 'images/logo/herb.png',
	currentStep = 1,
	steps = [],
	councilInfo = { name: 'unknown' },
}) {
	const t = useTranslation();
	const small = useMediaQuery('(max-width: 760px)');
	console.log('[SideBar].SideBar councilInfo', councilInfo);
	return <Box
		is='aside'
		className='SetupWizard__SideBar'
		flexGrow={0}
		flexShrink={1}
		flexBasis={small ? 'auto' : '350px'}
		maxHeight='sh'
		display='flex'
		flexDirection='column'
		flexWrap='nowrap'
		style={{ overflow: 'hidden' }}
	>
		<Box
			is='header'
			marginBlockStart={small ? 'x16' : 'x32'}
			marginBlockEnd={small ? 'none' : 'x32'}
			marginInline='x24'
			display='flex'
			flexDirection='row'
			flexWrap='wrap'
			alignItems='center'
		>
			<img height='64' margin='x4' src={ getURL(logoSrc, { full: true }) }/>
			<Box
				is='span'
				margin='x4'
				paddingBlock='x4'
				paddingInline='x8'
				color='alternative'
				fontScale='micro'
				style={{
					whiteSpace: 'nowrap',
					textTransform: 'uppercase',
					backgroundColor: 'var(--color-dark, #2f343d)',
					borderRadius: '9999px',
				}}
			>
				{t('Council_invite_page_registration_of_participant', councilInfo.name)}
			</Box>
		</Box>

		{!small && <Scrollable>
			<Box
				flexGrow={1}
				marginBlockEnd='x16'
				paddingInline='x32'
			>
				<Margins blockEnd='x16'>
					<Box is='h2' fontScale='h1' color='default'>{t('Council_invite_page_registration_of_participant')}</Box>
					<Box is='p' color='hint' fontScale='p1'>{t('Council_invite_page_registration_of_participant_info')}</Box>
				</Margins>

				<Box is='ol'>
					{steps.map(({ step, title }) =>
						<Box
							key={step}
							is='li'
							className={[
								'SetupWizard__SideBar-step',
								step < currentStep && 'SetupWizard__SideBar-step--past',
							].filter(Boolean).join(' ')}
							data-number={step}
							marginBlock='x32'
							marginInline='neg-x8'
							display='flex'
							alignItems='center'
							fontScale='p2'
							color={(step === currentStep && 'primary')
							|| (step < currentStep && 'default')
							|| 'disabled'}
							style={{ position: 'relative' }}
						>
							{title}
						</Box>,
					)}
				</Box>
			</Box>
		</Scrollable>}
	</Box>;
}

export default SideBar;
