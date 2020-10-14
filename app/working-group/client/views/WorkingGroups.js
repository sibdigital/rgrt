import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';

export function WorkingGroups({
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
		<Th key={'workingGroupType'} direction={sort[1]} active={sort[0] === 'workingGroupType'} sort='workingGroupType' onClick={onHeaderClick} color='default'>
			{ t('Working_group') }
		</Th>,
		<Th key={'name'} style={{ width: '190px' }} color='default'>
			{t('Surname')} {t('Name')} {t('Patronymic')}
		</Th>,
		mediaQuery && <Th key={'type'} color='default'>
			{t('Council_Organization_Position')}
		</Th>,
		mediaQuery && <Th key={'Phone_number'} style={{ width: '190px' }} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'Email'} color='default'>
			{t('Email')}
		</Th>,
		<Th w='x40' key='edit'></Th>,
		<Th w='x40' key='download'></Th>
	], [sort, mediaQuery]);

	if (!data) {
		data = {};
	}


	const renderRow = (workingGroup) => {
		const { _id, workingGroupType, name, surname, patronymic, position, email, phone } = workingGroup;
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{workingGroupType}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{surname} {name} {patronymic}</Table.Cell>
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

	return <GenericTable header={header} renderRow={renderRow} results={data} total={data.total} setParams={setParams} params={params} />;
}
