import React, { useCallback, useMemo, useState } from 'react';
import { Box, Flex, Skeleton, Table } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ itemsPerPage, current }, [column, direction], protocolsFields) => useMemo(() => ({
	fields: JSON.stringify(protocolsFields),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, column, direction, protocolsFields]);

export function ProtocolChoose({ setProtocolId, setProtocol, close, protocolsFields = null }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const formatDate = useFormatDate();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['d']);
	const [refProtocolsFields, setRefProtocolsFields] = useState(protocolsFields ?? { place: 1, d: 1, num: 1 });

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, refProtocolsFields);

	const { data: protocolData, state: protocolState } = useEndpointDataExperimental('protocols.list', query);

	const onProtocolClick = useCallback((protocol) => {
		setProtocolId && setProtocolId(protocol._id);
		setProtocol && setProtocol({ ...protocol, label: [t('Protocol'), ' ', t('Date_to'), ' ', formatDate(protocol.d), ' №', protocol.num].join('') });
		close();
	}, [setProtocolId, setProtocol, t, formatDate, close]);

	const header = useMemo(() => [
		<Th w='x100' key={'Protocol_Number'} color='default'>
			{ t('Protocol_Number') }
		</Th>,
		<Th w='x160' key={'Date'} color='default'>
			{ t('Date') }
		</Th>,
		<Th w='x200' key={'Protocol_Place'} color='default'>
			{ t('Protocol_Place') }
		</Th>,
	], [t]);

	const renderRow = (protocol) => {
		const { _id, place, d, num } = protocol;
		return <Table.Row key={_id} tabIndex={0} role='link' action onClick={() => onProtocolClick(protocol)}>
			<Table.Cell fontScale='p1' color='default'>{num ?? ''}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{formatDateAndTime(d ?? '')}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{place ?? ''}</Table.Cell>
		</Table.Row>;
	};

	if ([protocolState].includes(ENDPOINT_STATES.LOADING)) {
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

	return <GenericTable header={header} renderRow={renderRow} results={protocolData.protocols} total={protocolData.total} setParams={setParams} params={params}/>;
}

export default ProtocolChoose;
