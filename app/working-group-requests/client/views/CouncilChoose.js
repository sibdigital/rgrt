import React, { useCallback, useMemo, useState } from 'react';
import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useMethod } from '../../../../client/contexts/ServerContext';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ itemsPerPage, current }, [column, direction], councilsFields) => useMemo(() => ({
	// query: JSON.stringify({}),
	fields: JSON.stringify(councilsFields),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [councilsFields, column, direction, itemsPerPage, current]);

export function CouncilChoose({ setCouncilId, setCouncil, setProtocol, close }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['d']);
	const [refCouncilsFields, setRefCouncilsFields] = useState({ place: 1, d: 1, type: 1 });

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, refCouncilsFields);

	const { data: councilData } = useEndpointDataExperimental('councils.list', query);

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
