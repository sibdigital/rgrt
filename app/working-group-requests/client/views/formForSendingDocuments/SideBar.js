import { Box, Margins, Scrollable } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { getURL } from '../../../../utils';
import '../../../../councils/client/views/invite/SideBar.css';

function SideBar({
	logoSrc = 'images/logo/herb.svg',
	currentStep = 1,
	steps = [],
	requestInfo = { name: 'unknown' },
}) {
	const t = useTranslation();
	const small = useMediaQuery('(max-width: 760px)');
	console.log('[SideBar].SideBar workingGroupRequest', requestInfo);
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
			flexDirection='column'
			flexWrap='wrap'
		>
			<Box
				display='flex'
				flexDirection='row'
			>
				<img height='64' margin='x4' src={ getURL(logoSrc, { full: true }) }/>
				<Box
					is='span'
					margin='x4'
					paddingBlock='x4'
					paddingInline='x8'
				>
					{t('Commission of the State Council of the Russian Federation in the direction of \"Transport\"')}
				</Box>
			</Box>
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
					textAlign: 'center'
				}}
			>
				{t('Working_group_request_invite_page', requestInfo.name)}
			</Box>
		</Box>

		{!small && <Scrollable>
			<Box
				flexGrow={1}
				marginBlockEnd='x16'
				paddingInline='x32'
			>
				<Margins blockEnd='x16'>
					<Box is='h2' fontScale='h1' color='default'>{t('Working_group_request_invite_page')}</Box>
					<Box is='p' color='hint' fontScale='p1'>{t('Working_group_request_invite_page_info')}</Box>
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
