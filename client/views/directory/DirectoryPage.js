import React, { useEffect, useCallback } from 'react';
import { Button, Field, Icon, Label, Tabs } from '@rocket.chat/fuselage';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import UserTab from './UserTab';
import ChannelsTab from './ChannelsTab';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { GoBackButton } from '../../../app/utils/client/views/GoBackButton';

function DirectoryPage() {
	const t = useTranslation();

	const defaultTab = useSetting('Accounts_Directory_DefaultView');

	const federationEnabled = useSetting('FEDERATION_Enabled');

	const tab = useRouteParameter('tab');

	const directoryRoute = useRoute('directory');
	const handleTabClick = useCallback((tab) => () => directoryRoute.push({ tab }), [directoryRoute]);

	useEffect(() => {
		if (!tab || (tab === 'external' && !federationEnabled)) {
			return directoryRoute.replace({ tab: defaultTab });
		}
	}, [directoryRoute, tab, federationEnabled, defaultTab]);

	return <Page>
		<Page.Header>
			<Field width={'100%'} display={'block'} marginBlock={'15px'}>
				<GoBackButton/>
				<Label fontScale='h1'>{t('Directory')}</Label>
			</Field>
		</Page.Header>
		<Tabs flexShrink={0} >
			<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>{t('Channels')}</Tabs.Item>
			<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>{t('Users')}</Tabs.Item>
			{ federationEnabled && <Tabs.Item selected={tab === 'external'} onClick={handleTabClick('external')}>{t('External_Users')}</Tabs.Item> }
		</Tabs>
		<Page.Content>
			{
				(tab === 'users' && <UserTab />)
			|| (tab === 'channels' && <ChannelsTab />)
			|| (federationEnabled && tab === 'external' && <UserTab workspace='external' />)
			}

		</Page.Content>
	</Page>;
}


DirectoryPage.displayName = 'DirectoryPage';

export default DirectoryPage;
