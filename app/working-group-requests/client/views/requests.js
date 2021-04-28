import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import { useUserId } from '../../../../client/contexts/UserContext';
import { hasPermission } from '../../../authorization';

export function Requests({
	data,
	sort,
	onClick,
	onEditClick,
	onDeleteClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const userId = useUserId();
	const t = useTranslation();
	const formatDate = useFormatDate();
	const canAddRequest = hasPermission('manage-working-group-requests', userId);

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'Number'} style={{ width: '100px' }} color='default'>
			{t('Number')}
		</Th>,
		<Th key={'Council'} style={{ width: '230px' }} color='default'>
			{t('Council')}
		</Th>,
		<Th key={'Errand_Base'} style={{ width: '240px' }} color='default'>
			{t('Errand_Base')}
		</Th>,
		<Th key={'Errand_Charged_to'} color='default'>
			{t('Errand_Charged_to')}
		</Th>,
		<Th key={'Created_at'} color='default'>
			{t('Created_at')}
		</Th>,
		canAddRequest && <Th w='x40' key='edit'/>,
		canAddRequest && <Th w='x40' key='delete'/>,
	], [canAddRequest, t]);

	const renderRow = (request) => {
		const { _id, number, ts, protocol, council, itemResponsible } = request;
		const councilLabel = council?.d ? [t('Council'), ' от ', formatDate(council.d)].join('') : '';
		const protocolLabel = protocol?.d && protocol?.itemNum && protocol?.num ? [t('Protocol_Item'), ' №', protocol.itemNum, ' протокола от ', formatDate(protocol.d), ' №', protocol.num].join('') : '';
		const responsible = typeof itemResponsible === 'object' ? constructPersonFIO(itemResponsible) : itemResponsible;
		const mailLabel = request.mail ? [t('Working_group_mail')].join('') : '';
		const baseLabel = request.requestType?.state === 1 ? protocolLabel : mailLabel;

		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{number ?? '???'}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>
				{councilLabel}
			</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>
				{baseLabel}
			</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{responsible}</Box></Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{formatDate(ts)}</Box></Table.Cell>
			{canAddRequest && <Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>}
			{canAddRequest && <Table.Cell alignItems={'end'}>
				<Button small onClick={onDeleteClick(_id)} aria-label={t('Delete')}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data} total={data.length} setParams={setParams} params={params} />;
}
