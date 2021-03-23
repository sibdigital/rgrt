import React, { useCallback, useMemo, useState } from 'react';
import { Table } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useMethod } from '../../../../client/contexts/ServerContext';

export function CouncilChoose({ setCouncilId, setCouncil, setProtocol, close }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const { data: councilData } = useEndpointDataExperimental('councils.list', useMemo(() => ({
		fields: JSON.stringify({ place: 1, d: 1, type: 1 }),
		sort: JSON.stringify({ d: -1 }),
	}), []));

	const getProtocolByCouncilId = useMethod('getProtocolByCouncilId');

	const getProtocolFunc = useCallback(async (id) => {
		try {
			const data = await getProtocolByCouncilId(id, { fields: { place: 1, d: 1, num: 1 } });
			return data;
		} catch (error) {
			console.dir({ error });
			return {};
		}
	}, [getProtocolByCouncilId]);

	const onCouncilClick = useCallback(async (council) => {
		setCouncilId && setCouncilId(council._id);
		setCouncil && setCouncil({ ...council, label: [t('Council'), t('Date_to'), formatDateAndTime(council.d)].join(' ') });
		const protocol = await getProtocolFunc(council._id);
		protocol && protocol._id && setProtocol(protocol);
		close();
	}, [setCouncilId, setCouncil, t, formatDateAndTime, getProtocolFunc, setProtocol, close]);

	const header = useMemo(() => [
		<Th w='x200' key={'Council_place'} color='default'>
			{ t('Council_place') }
		</Th>,
		<Th w='x100' key={'Council_type'} color='default'>
			{ t('Council_type') }
		</Th>,
		<Th w='x160' key={'Date'} color='default'>
			{ t('Date') }
		</Th>,
	], [t]);

	const renderRow = (council) => {
		const { _id, place, d, type } = council;
		return <Table.Row key={_id} tabIndex={0} role='link' action onClick={() => onCouncilClick(council)}>
			<Table.Cell fontScale='p1' color='default'>{place ?? ''}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{type?.title ?? ''}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{formatDateAndTime(d ?? '')}</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={councilData?.councils ?? []} total={councilData?.total ?? 0} setParams={setParams} params={params}/>;
}

export default CouncilChoose;
