import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { GenericTable, Th } from '../../../../client/components/GenericTable';

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
		<Th key={'Number'} style={{ width: '100px' }} color='default'>
			{t('Number')}
		</Th>,
		<Th key={'Council'} style={{ width: '230px' }} color='default'>
			{t('Council')}
		</Th>,
		<Th key={'Protocol_Item'} style={{ width: '240px' }} color='default'>
			{t('Protocol_Item')}
		</Th>,
		<Th key={'Errand_Charged_to'} color='default'>
			{t('Errand_Charged_to')}
		</Th>,
		<Th key={'Created_at'} color='default'>
			{t('Created_at')}
		</Th>,
		<Th w='x40' key='edit'/>,
	], [mediaQuery]);

	const renderRow = (request) => {
		const { _id, number, ts, protocol, council } = request;
		const councilLabel = council?.d ? [t('Council'), ' от ', formatDate(council.d)].join('') : '';
		const protocolLabel = protocol?.d && protocol?.itemNum && protocol?.num ? [t('Protocol_Item'), ' №', protocol.itemNum, ' протокола от ', formatDate(protocol.d), ' №', protocol.num].join('') : '';

		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{number ?? '???'}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>
				{councilLabel}
			</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>
				{protocolLabel}
			</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{protocol?.itemResponsible}</Box></Table.Cell>
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
