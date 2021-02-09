import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';

export function Requests({
	data,
	sort,
	onClick,
	onEditClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'Number'} style={{ width: '190px' }} color='default'>
			{t('Number')}
		</Th>,
		<Th key={'Description'} style={{ width: '190px' }} color='default'>
			{t('Description')}
		</Th>,
		<Th key={'Created_at'} color='default'>
			{t('Created_at')}
		</Th>,
		<Th w='x40' key='edit'></Th>,
	], [mediaQuery]);

	const renderRow = (request) => {
		const { _id, number, desc, ts } = request;
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{number ?? 'null'}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{desc}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{formatDate(ts)}</Box></Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data} total={data.length} setParams={setParams} params={params} />;
}