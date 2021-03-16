import React, { useCallback, useMemo, useState } from 'react';
import { Box, Flex, Skeleton, Table } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GenericTable, Th } from '../../../../client/components/GenericTable';

export function ProtocolChoose({ setProtocolId, setProtocol, close }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const { data: protocolData, state: protocolState } = useEndpointDataExperimental('protocols.list', useMemo(() => ({
		fields: JSON.stringify({ place: 1, d: 1, num: 1, sections: 1 }),
		sort: JSON.stringify({ d: -1 }),
	}), []));

	const onProtocolClick = useCallback((protocol) => {
		console.log({ protocol });
		setProtocolId(protocol._id);
		setProtocol(protocol);
		close();
	}, [setProtocolId, close, setProtocol]);

	const header = useMemo(() => [
		<Th w='x200' key={'Protocol_Place'} color='default'>
			{ t('Protocol_Place') }
		</Th>,
		<Th w='x100' key={'Protocol_Number'} color='default'>
			{ t('Protocol_Number') }
		</Th>,
		<Th w='x160' key={'Date'} color='default'>
			{ t('Date') }
		</Th>,
	], [t]);

	const renderRow = (protocol) => {
		const { _id, place, d, num } = protocol;
		return <Table.Row key={_id} tabIndex={0} role='link' action onClick={() => onProtocolClick(protocol)}>
			<Table.Cell fontScale='p1' color='default'>{place ?? ''}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{num ?? ''}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{formatDateAndTime(d ?? '')}</Table.Cell>
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
