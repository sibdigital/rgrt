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
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'name'} style={{ width: '190px' }} color='default'>
			{t('Full_Name')}
		</Th>,
		mediaQuery && <Th key={'Phone_number'} style={{ width: '190px' }} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'Email'} color='default'>
			{t('Email')}
		</Th>,
		<Th w='x40' key='edit'/>,
	], [sort, mediaQuery]);

	const renderRow = (person) => {
		const { _id, name, surname, patronymic, email, emails, phone, avatarUrl } = person;
		// const email = emails ? emails[0].address : '';
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(_id, person)} color='default'> {surname} {name} {patronymic}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id, person)} color='default'>{phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id, person)} color='default'><Box withTruncatedText>{email}</Box></Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id, person)} aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data?.persons ?? []} total={data?.persons?.length || 0} setParams={setParams} params={params} />;
}
