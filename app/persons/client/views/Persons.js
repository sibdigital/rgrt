import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';

export function Persons({
	data,
	sort,
	onClick,
	onEditClick,
	onDeleteClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'Weight'} color='default' width='x50'>{t('Weight')}</Th>,
		<Th key={'name'} style={{ width: '190px' }} color='default'>
			{t('Full_Name')}
		</Th>,
		mediaQuery && <Th key={'Phone_number'} style={{ width: '190px' }} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'Email'} style={{ width: '190px' }} color='default'>
			{t('Email')}
		</Th>,
		mediaQuery && <Th key={'Organization'} style={{ width: '190px' }} color='default'>
			{t('Organization')}
		</Th>,
		mediaQuery && <Th key={'Position'} color='default'>
		{t('Position')}
	</Th>,
		<Th w='x40' key='edit'/>,
		<Th w='x40' key='delete'/>,
	], [sort, mediaQuery]);

	const renderRow = (person) => {
		const { weight, _id, name, surname, patronymic, email, phone, organization, position, group, avatarSource } = person;
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(_id, person)} color='default'>{weight ?? ''}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id, person)} color='default'> {surname} {name} {patronymic}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id, person)} color='default'>{phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id, person)} color='default'><Box withTruncatedText>{email}</Box></Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id, person)} color='default'>{organization}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id, person)} color='default'>{position}</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id, person)} aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onDeleteClick(_id)} aria-label={t('Delete')}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data?.persons ?? []} total={data?.persons?.length || 0} setParams={setParams} params={params} />;
}
