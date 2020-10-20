import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '/client/hooks/useFormatDateAndTime';

export function WorkingGroupsMeetings({
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
		<Th key={'d'} direction={sort[1]} active={sort[0] === 'd'} onClick={onHeaderClick} sort='d' style={{ width: '190px' }} color='default'>{t('Date')}</Th>,
		<Th key={'desc'} color='default'>{t('Description')}</Th>,
		mediaQuery && <Th key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '190px' }} color='default'>{t('Created_at')}</Th>,
		<Th w='x40' key='edit'></Th>,
	], [sort, mediaQuery]);

	const formatDateAndTime = useFormatDateAndTime();

	if (!data) {
		data = {};
	}

	const renderRow = (workingGroupsMeetings) => {
		const { _id, d: date, desc, ts } = workingGroupsMeetings;
		return <Table.Row key={_id} tabIndex={0} role='link' action >
			<Table.Cell fontScale='p1' onClick={onClick(_id)} >{formatDateAndTime(date)} </Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} ><Box withTruncatedText>{desc}</Box></Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} >{formatDateAndTime(ts)}</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')} >
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data} total={data.total} setParams={setParams} params={params} />;
}
