import React, { useCallback, useMemo, useState } from 'react';
import { Box, Flex, Skeleton, Table } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GenericTable, Th } from '../../../../client/components/GenericTable';

export function CouncilChoose({ setCouncilId, close }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const { data: councilData, state: councilState } = useEndpointDataExperimental('councils.list', useMemo(() => ({
		fields: JSON.stringify({ place: 1, d: 1, type: 1 }),
		sort: JSON.stringify({ d: -1 }),
	}), []));

	const onCouncilClick = useCallback((council) => {
		console.log({ council });
		setCouncilId(council._id);
		close();
	}, [setCouncilId, close]);

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

	if ([councilState].includes(ENDPOINT_STATES.LOADING)) {
		return <Table.Row>
			<Table.Cell>
				<Box display='flex'>
					<Flex.Item>
						<Skeleton variant='rect' height={40} width={40} />
					</Flex.Item>
					<Box mi='x8' flexGrow={1}>
						<Skeleton width='100%' />
						<Skeleton width='100%' />
					</Box>
				</Box>
			</Table.Cell>
			{ Array.from({ length: 10 }, (_, i) => <Table.Cell key={i}>
				<Skeleton width='100%' />
			</Table.Cell>)}
		</Table.Row>;
	}

	return <GenericTable header={header} renderRow={renderRow} results={councilData.councils} total={councilData.total} setParams={setParams} params={params}/>;
}

export default CouncilChoose;
