import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { baseURI } from '../../../utils/client/lib/baseuri';
import UserAvatar from '../../../../client/components/basic/avatar/UserAvatar';

const getCommUserAvatarURL = function(username) {
	const avatarUrl = getUserAvatarURL(username);
	const baseURL = baseURI.replace(/\/$/, '');

	if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data')) {
		return `${ baseURL }${ avatarUrl }`;
	}

	return avatarUrl;
}

export function WorkingGroups({
	userData,
	sort,
	onClick,
	onEditClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'userAvatar'} color='default' w='x80'>
		</Th>,
		// <Th key={'workingGroup'} direction={sort[1]} active={sort[0] === 'workingGroup'} sort='workingGroup' onClick={onHeaderClick} color='default'>
		// 	{ t('Working_group') }
		// </Th>,
		<Th key={'name'} style={{ width: '190px' }} color='default'>
			{t('Full_Name')}
		</Th>,
		mediaQuery && <Th key={'Organization'} color='default'>
			{t('Organization')}
		</Th>,
		mediaQuery && <Th key={'Position'} color='default'>
			{t('Position')}
		</Th>,
		mediaQuery && <Th key={'Phone_number'} style={{ width: '190px' }} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'Email'} color='default'>
			{t('Email')}
		</Th>,
		<Th w='x40' key='edit'></Th>,
	], [sort, mediaQuery]);

	const filterUserData = userData.users ? userData.users.filter((item) => item.workingGroup === 'Состав комиссии') : {};

	const renderRow = (userWorkingGroup) => {
		const { _id, workingGroup, username, name, surname, patronymic, organization, position, emails, phone } = userWorkingGroup;
		const email = emails ? emails[0].address : '';
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell color='default'><UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username}/></Table.Cell>
			{/* <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{workingGroup}</Table.Cell> */}
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{surname} {name} {patronymic}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{organization}</Box></Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{position}</Box></Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{email}</Box></Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={filterUserData} total={filterUserData.length} setParams={setParams} params={params} />;
}
